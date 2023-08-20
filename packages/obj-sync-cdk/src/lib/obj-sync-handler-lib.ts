import { ApiGatewayManagementApiClient, PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi";
import { cognitoBackendAuthProviderModule } from "@iyio/aws-credential-providers";
import { createUpdateExpression, dynamoClient } from "@iyio/aws-dynamo";
import { EnvParams, ScopeModule, initRootScope, unused } from "@iyio/common";
import { nodeCommonModule } from "@iyio/node-common";
import { ObjSyncClientCommand, ObjSyncClientConnection, ObjSyncConnectionTable, ObjSyncObjState, ObjSyncObjStateTable, ObjSyncRecursiveObjWatchEvt, ObjSyncRemoteCommand } from "@iyio/obj-sync";
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

export const sendStateToClientAsync=async (objId:string,clientId:string,connectionId:string)=>{

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

const sendData=<T>(connectionId:string,data:T)=>getApiClient().send(new PostToConnectionCommand({
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
    evts:ObjSyncRecursiveObjWatchEvt[]
)=>{

    verifyWriteAccess();

    let changeIndex:number|undefined;

    await dynamoClient().patchTableItem(ObjSyncObjStateTable,{
        objId,
        changeIndex:createUpdateExpression({add:1}),
        log:createUpdateExpression({listPush:evts}),
    },{
        handleReturnedValues:updated=>{
            console.log('hio 👋 👋 👋 updated props',{updated});
            changeIndex=updated?.changeIndex;
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

    await Promise.all(clients.items.map(async client=>{
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
        }
    }))
}
