import { ApiGatewayManagementApiClient, PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi";
import { cognitoBackendAuthProviderModule } from "@iyio/aws-credential-providers";
import { createUpdateExpression, dynamoClient } from "@iyio/aws-dynamo";
import { EnvParams, ObjMirror, ScopeModule, initRootScope, unused } from "@iyio/common";
import { nodeCommonModule } from "@iyio/node-common";
import { ObjSyncClientCommand, ObjSyncClientConnection, ObjSyncConnectionTable, ObjSyncConnectionTableIndexMap, ObjSyncObjState, ObjSyncObjStateTable, ObjSyncRecursiveObjWatchEvt, ObjSyncRemoteCommand, objSyncAutoMergeLogLengthParam } from "@iyio/obj-sync";
import { invokeObjSyncCreateDefaultStateFn, invokeObjSyncTransformClientConnectionFn } from "./obj-sync-cdk-fn-clients";

let _apiClient:ApiGatewayManagementApiClient|null=null;
const getApiClient=()=>{
    if(!_apiClient){
        _apiClient=new ApiGatewayManagementApiClient({
            region:process.env['AWS_REGION'],
            endpoint:process.env['OBJ_SYNC_SOCKET_ENDPOINT'],
        });
    }
    return _apiClient;
}

let _encoder:TextEncoder|null=null;
const getEncoder=()=>{
    if(!_encoder){
        _encoder=new TextEncoder();
    }
    return _encoder;
}

export const initBackend=(additionalModule?:ScopeModule)=>{
    initRootScope(reg=>{
        reg.addParams(new EnvParams());
        reg.use(nodeCommonModule);
        reg.use(additionalModule);
        reg.use(cognitoBackendAuthProviderModule);
        //reg.addProvider(FnEventTransformers,()=>fnEventTransformer);
    })
}


export const createClientConnectionAsync=async (cmd:ObjSyncRemoteCommand,socketId:string,userId?:string)=>{

    const client=await invokeObjSyncTransformClientConnectionFn({
        clientId:cmd.clientId,
        objId:cmd.objId,
        socketId,
        userId
    });

    await dynamoClient().putIntoTable(ObjSyncConnectionTable,client);

    return client;
}

export const sendStateToClientAsync=async (
    connectionId:string,
    {
        objId,
        clientId,
        defaultState,
        autoDeleteClientObjects,
        clientMapProp
    }:ObjSyncRemoteCommand,
)=>{

    const [
        client,
        _state,
    ]=await Promise.all([
        dynamoClient().getFromTableAsync(ObjSyncConnectionTable,{objId,clientId}),
        dynamoClient().getFromTableAsync(ObjSyncObjStateTable,{objId})
    ])

    if(!client){
        console.error('No client found with match ids',{objId,clientId});
        return;
    }

    if(client.socketId!==connectionId){
        console.error('connection id mismatch',{clientId,objId,connectionId});
        return;
    }

    let state=_state;
    if(!state){
        state=await invokeObjSyncCreateDefaultStateFn({
            type:'get',
            objId,
            clientId,
            defaultState,
            autoDeleteClientObjects,
            clientMapProp
        });

        if(!state){
            console.error('Unable to create default state for obj',{objId,clientId});
            return;
        }

        await dynamoClient().putIntoTable(ObjSyncObjStateTable,state);

        state=await dynamoClient().getFromTableAsync(ObjSyncObjStateTable,{objId});

        if(!state){
            console.error('Refetching obj state return undefined state',{objId,clientId});
            return;
        }
    }

    if(!verifyReadAccess(client,state)){
        console.error('Read access denied',{objId,clientId});
        return;
    }

    await sendData<ObjSyncClientCommand>(client.socketId,{
        type:'set',
        clientId,
        objId,
        changeIndex:state.changeIndex,
        state,
    });
}

export const sendData=<T>(connectionId:string,data:T)=>getApiClient().send(new PostToConnectionCommand({
    Data:getEncoder().encode(JSON.stringify(data)),
    ConnectionId:connectionId
}))

const verifyReadAccess=(client:ObjSyncClientConnection,state:ObjSyncObjState):boolean=>{
    /*todo - really check*/ unused(client); unused(state);
    return true;
}

const verifyWriteAccess=():boolean=>{
    /*todo - really check*/
    return true;
}

export const queueSyncEvtAsync=async (
    objId:string,
    clientId:string,
    connectionId:string,
    evts:ObjSyncRecursiveObjWatchEvt[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    byPassSecurity=false,
)=>{

    verifyWriteAccess();

    let changeIndex:number|undefined;
    let logLength:number|undefined;

    await dynamoClient().patchTableItem(ObjSyncObjStateTable,{
        objId,
        changeIndex:createUpdateExpression({add:1}),
        log:createUpdateExpression({listPush:evts}),
    },{
        handleReturnedValues:updated=>{
            changeIndex=updated?.changeIndex;
            logLength=updated?.log?.length;
        }
    })

    if(changeIndex===undefined){
        console.error('Change index not returned');
        return;
    }

    const clients=await dynamoClient().queryMatchTableAsync({
        table:ObjSyncConnectionTable,
        matchKey:{objId},
        limit:100
    });


    if(clients.lastKey){
        //todo - trigger function to send update to remaining clients
    }

    const promises:Promise<any>[]=clients.items.map(async client=>{
        try{
            await sendData<ObjSyncClientCommand>(client.socketId,{
                changeIndex:changeIndex??0,
                objId,
                clientId:client.clientId,
                type:'evt',
                evts:evts as any
            })
        }catch(ex){
            console.error('Unable to send message to client',{objId,clientId:client.clientId});
            try{
                await cleanUpSocket(client.socketId);
            }catch(ex){
                console.error('Clean up socket failed',client)
            }
        }
    })

    if(logLength && logLength>=objSyncAutoMergeLogLengthParam()){
        promises.push(safeMergeLogIntoStateAsync(objId,changeIndex))
    }

    await Promise.all(promises);
}

const safeMergeLogIntoStateAsync=async (objId:string,changeIndex?:number):Promise<boolean>=>{
    try{
        return await mergeLogIntoStateAsync(objId,changeIndex);
    }catch(ex){
        console.error(`Merge log into state failed. objId:${objId}`,ex);
        return false;
    }
}

/**
 * Merges the change events in the log of a ObjSyncObjState in the it's state. This function should
 * be periodically call for ObjSyncObjState objects as their logs grow.
 * @param objId Id of the obj to merge
 * @param changeIndex If defined the object must have a matching change index in-order for the
 *                    merge to be committed
 * @returns true if the merge was committed
 */
const mergeLogIntoStateAsync=async (objId:string,changeIndex?:number):Promise<boolean>=>{
    const obj=await dynamoClient().getFromTableAsync(
        ObjSyncObjStateTable,
        {objId}
    )

    if(!obj?.state || (changeIndex!==undefined && changeIndex!==obj.changeIndex)){
        return false;
    }

    if(!obj.log?.length){
        return true;
    }

    const mirror=new ObjMirror(obj.state);
    mirror.handleEvents(obj.log as any);

    return await dynamoClient().patchTableItem(ObjSyncObjStateTable,{
        objId,
        log:[],
        state:obj.state,
    },{
        matchCondition:changeIndex===undefined?undefined:{
            changeIndex
        }
    })
}


export const isSocketRegistered=async (socketId:string):Promise<boolean>=>{
    const obj=await dynamoClient().queryMatchTableAsync({
        table:ObjSyncConnectionTable,
        index:ObjSyncConnectionTableIndexMap.socketId,
        matchKey:{
            socketId
        },
        limit:1,
    })
    return obj.items.length?true:false;
}

export const cleanUpSocket=async (socketId:string)=>{

    await dynamoClient().queryMatchTableAsync({
        table:ObjSyncConnectionTable,
        index:ObjSyncConnectionTableIndexMap.socketId,
        matchKey:{
            socketId
        },
        forEachPage:items=>items.map(async client=>{

            try{
                await dynamoClient().deleteFromTableAsync(
                    ObjSyncConnectionTable,
                    {
                        objId:client.objId,
                        clientId:client.clientId
                    }
                )
            }catch(ex){
                console.error('Unable to remove client from connections table',{socketId});
            }

            const stateObj=await dynamoClient().getFromTableAsync(
                ObjSyncObjStateTable,
                {objId:client.objId},
                {includeProps:['autoDeleteClientObjects','clientMapProp']}
            );

            if(!stateObj || !stateObj.autoDeleteClientObjects || !stateObj.clientMapProp){
                return;
            }

            await queueSyncEvtAsync(
                client.objId,
                client.clientId,
                client.socketId,
                [{
                    type:'delete',
                    prop:client.clientId,
                    path:[stateObj.clientMapProp]
                }],
                true
            )
        })
    })
}

