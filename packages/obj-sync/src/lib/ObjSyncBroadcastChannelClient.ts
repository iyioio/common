import { ObjSyncClient, ObjSyncClientOptions } from "./ObjSyncClient.js";
import { ObjSyncClientCommand, ObjSyncRemoteCommand } from "./obj-sync-types.js";

export interface ObjSyncBroadcastChannelClientOptions
{
    channelId:string;
}

export class ObjSyncBroadcastChannelClient extends ObjSyncClient
{

    public readonly channelId:string;

    private channel:BroadcastChannel|null=null;

    public constructor({
       channelId,
        ...options
    }:ObjSyncBroadcastChannelClientOptions & ObjSyncClientOptions){
        super(options);
        this.channelId=channelId;
    }

    protected override _dispose():void{
        this.channel?.close();
    }

    protected _connectAsync():Promise<void>{

        let opened=false;

        return new Promise((resolve,reject)=>{
            const channel=new BroadcastChannel(this.channelId);
            this.channel=channel;

            setTimeout(()=>{
                opened=true;
                resolve();
            },1);

            channel.addEventListener('messageerror',(err)=>{
                if(opened && channel===this.channel){
                    this.onDisconnected();
                }
                reject(err);
            })

            channel.addEventListener('message',(evt)=>{
                if(channel===this.channel){
                    this.handleCommand(evt.data)
                }
            })
        });
    }

    protected _send(cmds:(ObjSyncRemoteCommand|ObjSyncClientCommand)[]):void{
        this.channel?.postMessage(cmds);
    }

    protected override _pingLost(){
        this.channel?.close();
        this.channel=null;
    }

}
