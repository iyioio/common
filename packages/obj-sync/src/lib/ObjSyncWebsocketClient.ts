import { IWebSocket, Scope, WebSocketFactory, webSocketFactory } from "@iyio/common";
import { ObjSyncClient, ObjSyncClientOptions } from "./ObjSyncClient";
import { ObjSyncRemoteCommand } from "./obj-sync-types";
import { objSyncEndpointParam } from "./obj-sync.deps";
export interface ObjSyncWebsocketClientOptions
{
    endpoint:string;
    webSocketFactory:WebSocketFactory;
}

export class ObjSyncWebsocketClient extends ObjSyncClient
{

    public static fromScope(scope:Scope,options:Partial<ObjSyncWebsocketClientOptions>&ObjSyncClientOptions):ObjSyncWebsocketClient{
        return new ObjSyncWebsocketClient({
            ...options,
            endpoint:options?.endpoint??scope.to(objSyncEndpointParam)(),
            webSocketFactory:options?.webSocketFactory??scope.to(webSocketFactory).generate
        })
    }

    private endpoint:string;

    private socket:IWebSocket|null=null;

    private webSocketFactory:WebSocketFactory;

    public constructor({
        endpoint,
        webSocketFactory,
        ...options
    }:ObjSyncWebsocketClientOptions & ObjSyncClientOptions){
        super({
            pingIntervalMs:10000,
            ...options
        });
        this.endpoint=endpoint;
        this.webSocketFactory=webSocketFactory;
    }

    protected override _dispose():void{
        this.socket?.close();
    }

    protected _connectAsync():Promise<void>{

        let opened=false;

        return new Promise((resolve,reject)=>{
            const socket=this.webSocketFactory(this.endpoint);
            this.socket=socket;

            socket.addEventListener('open',()=>{
                opened=true;
                resolve();
            })

            socket.addEventListener('close',()=>{
                if(opened && socket===this.socket){
                    this.onDisconnected();
                }
                reject();
            })

            socket.addEventListener('error',(err)=>{
                if(opened && socket===this.socket){
                    this.onDisconnected();
                }
                reject(err);
            })

            socket.addEventListener('message',(evt)=>{
                if(socket===this.socket){
                    this.handleCommand(JSON.parse(evt.data))
                }
            })
        });
    }

    protected _send(cmds:ObjSyncRemoteCommand[]):void{
        this.socket?.send(JSON.stringify(cmds));
    }

    protected override _pingLost(){
        this.socket?.close();
        this.socket=null;
    }

}
