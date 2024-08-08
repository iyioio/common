import { DisposeCallback, DisposeContainer, EvtQueue, deepClone } from "@iyio/common";
import { Observable, Subject } from "rxjs";
import { VfsMntCtrl } from "./VfsMntCtrl";
import { VfsTriggerCtrl, VfsTriggerCtrlOptionsBase } from "./VfsTriggerCtrl";
import { vfsMntPtProvider } from "./vfs-deps";
import { createNotFoundVfsDirReadResult, getVfsSourceUrl, normalizeVfsPath, sortVfsMntPt, vfsTopic } from "./vfs-lib";
import { VfsConfig, VfsDirReadOptions, VfsDirReadResult, VfsItem, VfsItemChangeEvt, VfsItemGetOptions, VfsMntPt, VfsMntPtProviderConfig, VfsReadStream, VfsReadStreamWrapper, VfsWatchHandle, VfsWatchOptions } from "./vfs-types";

export interface VfsCtrlOptions
{
    config?:VfsConfig;
    /**
     * @default {searchRootScope:true}
     */
    mntProviderConfig?:VfsMntPtProviderConfig;

}

export class VfsCtrl
{

    private readonly config:VfsConfig;

    private readonly mntProviderConfig:VfsMntPtProviderConfig;

    private readonly _onItemsChange=new Subject<VfsItemChangeEvt>();
    public get onItemsChange():Observable<VfsItemChangeEvt>{return this._onItemsChange}

    /**
     * Returns a deep clone of the filesystem's config
     */
    public getConfig(){
        return deepClone(this.config);
    }

    public constructor({
        config={mountPoints:[]},
        mntProviderConfig={searchRootScope:true},
    }:VfsCtrlOptions={}){
        this.config=deepClone(config);
        sortVfsMntPt(this.config.mountPoints);
        this.mntProviderConfig=mntProviderConfig;
        if(mntProviderConfig.ctrls){
            for(const ctrl of mntProviderConfig.ctrls){
                this.registerMntCtrl(ctrl);
            }
        }
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

    public publishTo(queue:EvtQueue,topic=vfsTopic):DisposeCallback
    {
        const sub=this.onItemsChange.subscribe(e=>{
            queue.queue(topic,e);
        });

        return ()=>{
            sub.unsubscribe();
        }
    }

    public createTriggerCtrl(options:VfsTriggerCtrlOptionsBase):VfsTriggerCtrl
    {
        const triggerCtrl=new VfsTriggerCtrl({
            vfs:this,
            config:this.config,
            ...options
        });
        this.disposables.add(triggerCtrl);
        return triggerCtrl;
    }



    public async canGetItem(path:string){return (await this.getMntCtrlAsync(path))?.canGetItem??false}
    public async canReadDir(path:string){return (await this.getMntCtrlAsync(path))?.canReadDir??false}
    public async canMkDir(path:string){return (await this.getMntCtrlAsync(path))?.canMkDir??false}
    public async canRmDir(path:string){return (await this.getMntCtrlAsync(path))?.canRmDir??false}
    public async canReadString(path:string){return (await this.getMntCtrlAsync(path))?.canReadString??false}
    public async canAppendString(path:string){return (await this.getMntCtrlAsync(path))?.canAppendString??false}
    public async canWriteFile(path:string){return (await this.getMntCtrlAsync(path))?.canWriteFile??false}
    public async canReadBuffer(path:string){return (await this.getMntCtrlAsync(path))?.canReadBuffer??false}
    public async canWriteBuffer(path:string){return (await this.getMntCtrlAsync(path))?.canWriteBuffer??false}
    public async canWriteStream(path:string){return (await this.getMntCtrlAsync(path))?.canWriteStream??false}
    public async canGetReadStream(path:string){return (await this.getMntCtrlAsync(path))?.canGetReadStream??false}
    public async canWatch(path:string){return (await this.getMntCtrlAsync(path))?.canWatch??false}

    private readonly mntCtrlLookup:Record<string,VfsMntCtrl>={}
    private readonly mntCtrls:CtrlInfo[]=[];

    /**
     * Registers a new mount controller. Only 1 mount controller per type is allowed.
     */
    public registerMntCtrl(ctrl:VfsMntCtrl,disposeWithFs=true){
        if(this.mntCtrlLookup[ctrl.type]){
            if(disposeWithFs){
                ctrl.dispose();
            }
            throw new Error('A mount point control of type "${ctrl.type}" has already been registered')
        }
        this.mntCtrlLookup[ctrl.type]=ctrl;
        const sub=ctrl.onItemsChange.subscribe(evt=>{
            this._onItemsChange.next(evt);
        })
        let connected=true;
        const info:CtrlInfo={
            ctrl,
            dispose:()=>{
                if(!connected){
                    return;
                }
                const i=this.mntCtrls.findIndex(info=>info.ctrl===ctrl);
                if(i===-1){
                    throw new Error('VfsMntCtrl info not found in list of controllers');
                }
                connected=false;
                sub.unsubscribe();
                this.mntCtrls.splice(i,1);
                delete this.mntCtrlLookup[ctrl.type];
                if(disposeWithFs){
                    ctrl.dispose();
                }
            }
        };
        this.mntCtrls.push(info);
        this.disposables.addCb(info.dispose);
    }

    unregisterMntCtrl(ctrl:VfsMntCtrl){
        const info=this.mntCtrls.find(i=>i.ctrl===ctrl);
        if(!info){
            return false;
        }
        info.dispose();
        return true;
    }

    public addMntPt(mnt:VfsMntPt):void{
        this.config.mountPoints.push(deepClone(mnt));
        sortVfsMntPt(this.config.mountPoints);
    }

    public removeMntPt(path:string):VfsMntPt|undefined{
        for(let i=0;i<this.config.mountPoints.length;i++){
            const item=this.config.mountPoints[i];
            if(item?.mountPath===path){
                this.config.mountPoints.splice(i,1);
                return item;
            }
        }
        return undefined;
    }

    /**
     * Returns a mount controller for the given mount point.
     */
    public async getMntCtrlAsync(mnt:VfsMntPt|string):Promise<VfsMntCtrl|undefined>
    {

        if(typeof mnt==='string'){
            const m=this.getMntPt(mnt);
            if(!m){
                return undefined;
            }
            mnt=m;
        }

        let ctrl=this.mntCtrlLookup[mnt.type];
        if(ctrl){
            return ctrl;
        }

        if(this.mntProviderConfig.getCtrl){
            ctrl=await this.mntProviderConfig.getCtrl(mnt);
            if(ctrl){
                this.registerMntCtrl(ctrl);
                return ctrl;
            }
        }

        if(!this.mntProviderConfig.searchRootScope){
            return undefined;
        }

        ctrl=vfsMntPtProvider.get(mnt.type);
        if(ctrl){
            this.registerMntCtrl(ctrl);
        }

        return ctrl;
    }

    public async requireMntCtrlAsync(mnt:VfsMntPt):Promise<VfsMntCtrl>
    {
        const ctrl=await this.getMntCtrlAsync(mnt);
        if(!ctrl){
            throw new Error(`mount controller not found for mount point. type:${mnt.type}, mount path:${mnt.mountPath}`);
        }
        return ctrl;
    }

    public getMntPt(path:string):VfsMntPt|undefined
    {
        if(!path.startsWith('/')){
            path='/'+path;
        }
        for(let i=0;i<this.config.mountPoints.length;i++){
            const m=this.config.mountPoints[i];
            if(path.startsWith(m?.mountPath??'')){
                return m;
            }
        }
        return undefined;
    }

    private readonly watchHandles:Record<string,WatchHandle>={}
    public async startWatchingAllAsync(options?:VfsWatchOptions):Promise<number>{
        const results=await Promise.all(this.config.mountPoints.map(m=>this.startWatchingAsync(m,options)))
        return results.reduce((p,c)=>p+(c?1:0),0);
    }

    public async startWatchingAsync(path:string|VfsMntPt,options?:VfsWatchOptions):Promise<boolean>
    {
        if(typeof path==='object'){
            path=path.mountPath
        }

        path=normalizeVfsPath(path);

        let wh=this.watchHandles[path];
        if(wh){
            wh.refCount++;
            return true;
        }

        const mnt=this.getMntPt(path);
        if(!mnt){
            return false;
        }
        const ctrl=await this.getMntCtrlAsync(mnt);
        if(!ctrl || !ctrl.canWatch){
            return false;
        }

        const handle=ctrl.watch(this,mnt,path,getVfsSourceUrl(mnt,path),options);
        if(!handle){
            return false;
        }

        wh={
            handle,
            refCount:1,
        }

        this.watchHandles[path]=wh;

        return true;
    }

    public stopWatchAsync(path:string|VfsMntPt):boolean{

        if(typeof path==='object'){
            path=path.mountPath
        }

        path=normalizeVfsPath(path);

        let wh=this.watchHandles[path];
        if(!wh){
            return false;
        }
        wh.refCount--;
        if(!wh.refCount){
            delete this.watchHandles[path];
            wh.handle.dispose?.();
        }
        return true;
    }

    public getWatchRefCount(path:string):number{
        path=normalizeVfsPath(path);
        return this.watchHandles[path]?.refCount??0;
    }

    /**
     * Gets a single item by path.
     */
    public async getItemAsync(path:string,options?:VfsItemGetOptions):Promise<VfsItem|undefined>
    {
        const mnt=this.getMntPt(path);
        if(!mnt){
            return undefined;
        }
        const ctrl=await this.getMntCtrlAsync(mnt);
        if(!ctrl){
            return undefined;
        }
        return await ctrl.getItemAsync(this,mnt,path,getVfsSourceUrl(mnt,path),options);
    }

    public async readDirAsync(options:VfsDirReadOptions):Promise<VfsDirReadResult>
    {

        const mnt=this.getMntPt(options.path);
        if(!mnt){
            return createNotFoundVfsDirReadResult(options);
        }
        const ctrl=await this.getMntCtrlAsync(mnt);
        if(!ctrl){
            return createNotFoundVfsDirReadResult(options);
        }
        return await ctrl.readDirAsync(this,mnt,options,getVfsSourceUrl(mnt,options.path));
    }
    public async mkDirAsync(path:string):Promise<VfsItem>
    {
        const mnt=this.getMntPt(path);
        if(!mnt){
            throw new Error(`No mount point found for path ${path}`);
        }
        const ctrl=await this.requireMntCtrlAsync(mnt);
        return await ctrl.mkDirAsync(this,mnt,path,getVfsSourceUrl(mnt,path));
    }
    public async removeAsync(path:string):Promise<VfsItem>
    {
        const mnt=this.getMntPt(path);
        if(!mnt){
            throw new Error(`No mount point found for path ${path}`);
        }
        const ctrl=await this.requireMntCtrlAsync(mnt);
        return await ctrl.removeAsync(this,mnt,path,getVfsSourceUrl(mnt,path));
    }
    public async tryReadStringAsync(path:string):Promise<string|undefined>
    {
        try{
            return await this.readStringAsync(path);
        }catch{
            return undefined;
        }
    }
    public async readStringAsync(path:string):Promise<string>
    {
        const mnt=this.getMntPt(path);
        if(!mnt){
            throw new Error(`No mount point found for path ${path}`);
        }
        const ctrl=await this.requireMntCtrlAsync(mnt);
        return await ctrl.readStringAsync(this,mnt,path,getVfsSourceUrl(mnt,path));
    }
    public async writeStringAsync(path:string,content:string):Promise<VfsItem>
    {
        const mnt=this.getMntPt(path);
        if(!mnt){
            throw new Error(`No mount point found for path ${path}`);
        }
        const ctrl=await this.requireMntCtrlAsync(mnt);
        return await ctrl.writeStringAsync(this,mnt,path,getVfsSourceUrl(mnt,path),content);
    }
    public async appendStringAsync(path:string,content:string):Promise<VfsItem>
    {
        const mnt=this.getMntPt(path);
        if(!mnt){
            throw new Error(`No mount point found for path ${path}`);
        }
        const ctrl=await this.requireMntCtrlAsync(mnt);
        return await ctrl.appendStringAsync(this,mnt,path,getVfsSourceUrl(mnt,path),content);
    }
    public async readBufferAsync(path:string):Promise<Uint8Array>
    {
        const mnt=this.getMntPt(path);
        if(!mnt){
            throw new Error(`No mount point found for path ${path}`);
        }
        const ctrl=await this.requireMntCtrlAsync(mnt);
        return await ctrl.readBufferAsync(this,mnt,path,getVfsSourceUrl(mnt,path));
    }
    public async writeBufferAsync(path:string,buffer:Uint8Array|Blob|Blob[]|string):Promise<VfsItem>
    {
        const mnt=this.getMntPt(path);
        if(!mnt){
            throw new Error(`No mount point found for path ${path}`);
        }
        const ctrl=await this.requireMntCtrlAsync(mnt);

        if(typeof buffer === 'string'){
            buffer=Buffer.from(buffer);
        }else if(Array.isArray(buffer)){
            buffer=new Blob(buffer);
        }

        return await ctrl.writeBufferAsync(this,mnt,path,getVfsSourceUrl(mnt,path),buffer);
    }
    public async writeStreamAsync(path:string,stream:VfsReadStream):Promise<VfsItem>
    {
        const mnt=this.getMntPt(path);
        if(!mnt){
            throw new Error(`No mount point found for path ${path}`);
        }
        const ctrl=await this.requireMntCtrlAsync(mnt);
        return await ctrl.writeStreamAsync(this,mnt,path,getVfsSourceUrl(mnt,path),stream);
    }
    public async getReadStreamAsync(path:string):Promise<VfsReadStreamWrapper>
    {
        const mnt=this.getMntPt(path);
        if(!mnt){
            throw new Error(`No mount point found for path ${path}`);
        }
        const ctrl=await this.requireMntCtrlAsync(mnt);
        return await ctrl.getReadStreamAsync(this,mnt,path,getVfsSourceUrl(mnt,path));
    }
}



interface CtrlInfo
{
    ctrl:VfsMntCtrl;
    dispose:()=>void;
}

interface WatchHandle
{
    handle:VfsWatchHandle;
    refCount:number;
}
