import { ManagedProps, NodeFn, NodeFnProps, TableBuilder, WebsocketApi, WebsocketApiProps, grantTableQueryPerms } from '@iyio/cdk-common';
import { ObjSyncConnectionTable, ObjSyncObjStateTable, objSyncClientConnectionTableParam, objSyncCreateDefaultStateFnArnParam, objSyncEndpointParam, objSyncObjStateTableParam, objSyncTransformClientConnectionFnArnParam } from '@iyio/obj-sync';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export interface ObjSyncConstructOptions
{
    managed?:ManagedProps;
    connectFnProps?:NodeFnProps;
    disconnectFnProps?:NodeFnProps;
    defaultFnProps?:NodeFnProps;
    webApiProps?:WebsocketApiProps;
    createDefaultStateFn?:lambda.Function;
    transformClientConnectionFn?:lambda.Function;
}

export class ObjSyncConstruct extends Construct
{

    public readonly websocketApi:WebsocketApi;

    public readonly connectionsTable:dynamodb.Table;

    public readonly objStateTable:dynamodb.Table;

    public readonly handlerFn:NodeFn;

    public constructor(scope:Construct,id:string,{
        managed={},
        connectFnProps,
        disconnectFnProps,
        defaultFnProps,
        webApiProps,
        createDefaultStateFn,
        transformClientConnectionFn,
    }:ObjSyncConstructOptions={})
    {
        super(scope,id);

        const {
            params
        }=managed;

        const connectFn=new NodeFn(this,'Connect',{
            // todo - handle path to fn when packaged in lib
            handlerFileName:'../../packages/obj-sync-cdk/src/lib/handlers/objSyncSocketConnect.ts',
            minify:true,
            timeoutMs:5*1000,
            ...connectFnProps,
        });

        const disconnectFn=new NodeFn(this,'Disconnect',{
            // todo - handle path to fn when packaged in lib
            handlerFileName:'../../packages/obj-sync-cdk/src/lib/handlers/objSyncSocketDisconnect.ts',
            minify:true,
            timeoutMs:5*1000,
            ...disconnectFnProps,
        });

        const handlerFn=new NodeFn(this,'Default',{
            // todo - handle path to fn when packaged in lib
            handlerFileName:'../../packages/obj-sync-cdk/src/lib/handlers/objSyncSocketDefault.ts',
            minify:true,
            timeoutMs:30*1000,
            ...defaultFnProps,
        });
        this.handlerFn=handlerFn;



        if(createDefaultStateFn){
            createDefaultStateFn.grantInvoke(handlerFn.func);
            handlerFn.func.addEnvironment(
                objSyncCreateDefaultStateFnArnParam.typeName,
                createDefaultStateFn.functionArn
            );
        }

        if(transformClientConnectionFn){
            transformClientConnectionFn.grantInvoke(handlerFn.func);
            handlerFn.func.addEnvironment(
                objSyncTransformClientConnectionFnArnParam.typeName,
                transformClientConnectionFn.functionArn
            );
        }



        const tables=new TableBuilder(this,'Tbls',{
            managed,
            tables:[
                {
                    tableDescription:ObjSyncConnectionTable,
                    arnParam:objSyncClientConnectionTableParam,
                    grantAccess:true,
                },
                {
                    tableDescription:ObjSyncObjStateTable,
                    arnParam:objSyncObjStateTableParam,
                    grantAccess:true,
                }
            ]
        });

        this.connectionsTable=tables.tableInfo[0]?.table as dynamodb.Table;
        this.objStateTable=tables.tableInfo[1]?.table as dynamodb.Table;

        grantTableQueryPerms(handlerFn.func,this.connectionsTable)
        this.connectionsTable.grantFullAccess(handlerFn.func);
        grantTableQueryPerms(handlerFn.func,this.objStateTable)
        this.objStateTable.grantFullAccess(handlerFn.func);
        handlerFn.func.addEnvironment(objSyncClientConnectionTableParam.typeName,this.connectionsTable.tableArn);
        handlerFn.func.addEnvironment(objSyncObjStateTableParam.typeName,this.objStateTable.tableArn);



        this.websocketApi=new WebsocketApi(this,'Sockets',{
            name:'Sockets',
            stageName:'prd',
            connectFn:connectFn.func,
            disconnectFn:disconnectFn.func,
            defaultFn:handlerFn.func,
            ...webApiProps,
        });
        this.websocketApi.grantManageConnections(handlerFn.func);

        handlerFn.func.addEnvironment('OBJ_SYNC_SOCKET_ENDPOINT',this.websocketApi.endpoint);

        if(params){
            params.setParam(objSyncEndpointParam,this.websocketApi.connectionUrl);
        }

    }
}
