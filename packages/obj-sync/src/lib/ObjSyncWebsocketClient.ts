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
        super(options);
        this.endpoint=endpoint;
        this.webSocketFactory=webSocketFactory;
    }

    public override dispose(): void {
        if(this.isDisposed){
            return;
        }
        super.dispose();
        this.socket?.close();
    }

    protected _connectAsync():Promise<void>{

        return new Promise((resolve,reject)=>{
            const socket=this.webSocketFactory(this.endpoint);
            this.socket=socket;

            socket.addEventListener('open',()=>{
                //
                resolve();
            })

            socket.addEventListener('close',()=>{
                //
                reject();
            })

            socket.addEventListener('error',(err)=>{
                //
                reject(err);
            })

            socket.addEventListener('message',(evt)=>{
                this.handleCommand(JSON.parse(evt.data))
            })
        });
    }

    protected _send(cmds:ObjSyncRemoteCommand[]):void{
        this.socket?.send(JSON.stringify(cmds));
    }

}
