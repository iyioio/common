import { DisposeContainer, Evt, EvtQueue, getDirectoryName, isEvtTriggerMatch, joinPaths, transformTriggerToEvent, tryCallEvtTriggerCallback } from "@iyio/common";
import { Observable, Subject } from "rxjs";
import { VfsCtrl } from "./VfsCtrl";
import { autoFormatVfsTriggers, vfsDefaultConfigFileName as defaultVfsConfigFileName, mergeVfsLocalFsConfig, vfsTopic } from "./vfs-lib";
import { VfsConfig, VfsItemChangeEvt, VfsLocalFsConfig, VfsTrigger } from "./vfs-types";

export interface VfsTriggerCtrlOptionsBase
{
    queue?:EvtQueue;
    publishTriggered?:boolean;
    subscribeToQueue?:boolean;
}
export interface VfsTriggerCtrlOptions extends VfsTriggerCtrlOptionsBase
{
    vfs:VfsCtrl;
    config:VfsConfig;
}

export class VfsTriggerCtrl
{

    private readonly vfs:VfsCtrl;
    private readonly config:VfsConfig;
    private readonly queue?:EvtQueue;
    private readonly publishTriggered?:boolean;

    private readonly _onTrigger=new Subject<VfsTrigger>();
    public get onTrigger():Observable<VfsTrigger>{return this._onTrigger}

    public constructor({
        vfs,
        config,
        queue,
        publishTriggered,
        subscribeToQueue,
    }:VfsTriggerCtrlOptions){
        this.vfs=vfs;
        this.config=config;
        this.queue=queue;
        this.publishTriggered=publishTriggered;

        if(subscribeToQueue && queue){
            this.disposables.addCb(queue.addListener(vfsTopic,(topic:string,evts:Evt[])=>{
                for(const e of evts){
                    this.handleEvtAsync(e as any);
                }
            }));
        }

        this.disposables.addSub(vfs.onItemsChange.subscribe(evt=>this.handleEvtAsync(evt)));
    }

    private readonly disposables=new DisposeContainer();
    private _isDisposed=false;
    public get isDisposed(){return this._isDisposed}
    public dispose()
    {
        if(this._isDisposed){
            return;
        }
        this._isDisposed=true;
        this.disposables.dispose();
    }

    public async handleEvtAsync(evt:VfsItemChangeEvt){
        const item=evt.value?.item;
        if( item?.type!=='file' ||
            !this.config.allowLocalConfig ||
            item.name===this.config.localConfigFileName ||
            item.name===defaultVfsConfigFileName
        ){
            return;
        }

        const mnt=this.vfs.getMntPt(item.path);
        if(!mnt || item.name===mnt.localConfigFileName){
            return;
        }

        const config:VfsLocalFsConfig={
            triggers:this.config.triggers?[...this.config.triggers]:undefined
        };

        if(this.config.allowRecursiveLocalConfig && mnt.allowRecursiveLocalConfig){
            await this.loadConfigAsync(config,getDirectoryName(item.path),true);
        }else{
            await this.loadConfigAsync(config,mnt.mountPath,false);
        }

        if(!config.triggers?.length){
            return;
        }

        autoFormatVfsTriggers(config.triggers);

        for(const trigger of config.triggers){
            if(isEvtTriggerMatch(trigger,evt) && evt.value){
                tryCallEvtTriggerCallback(trigger,evt,()=>{
                    if(!evt.value){
                        return;
                    }
                    const vEvt:VfsTrigger={...evt.value,trigger};
                    this._onTrigger.next(vEvt);
                    if(this.publishTriggered && trigger.topic && this.queue){
                        const tEvt=transformTriggerToEvent(trigger,{
                            trigger,
                            evt
                        })
                        if(tEvt){
                            this.queue.queue(trigger.topic,tEvt);
                        }
                    }
                })
            }
        }
    }

    private async loadConfigAsync(config:VfsLocalFsConfig,dir:string,recursive:boolean):Promise<void>{
        const mnt=this.vfs.getMntPt(dir);
        if(!mnt?.allowLocalConfig){
            return undefined;
        }
        const name=mnt.localConfigFileName??this.config.localConfigFileName??defaultVfsConfigFileName;

        const path=joinPaths(dir,name);
        const file=await this.vfs.readStringAsync(path);
        if(file){
            try{
                mergeVfsLocalFsConfig(config,JSON.parse(file));
            }catch(ex){
                console.error(`Error loading config file ${path}`)
            }
        }

        if(dir && dir!=='/' && recursive){
            await this.loadConfigAsync(config,getDirectoryName(dir),true)
        }
    }

}
