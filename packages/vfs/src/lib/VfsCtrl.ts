import { CancelToken, DisposeCallback, DisposeContainer, EvtQueue, UnauthorizedError, ValueRef, deepClone, joinPaths, minuteMs } from "@iyio/common";
import { Observable, Subject } from "rxjs";
import { VfsMntCtrl } from "./VfsMntCtrl";
import { VfsTriggerCtrl, VfsTriggerCtrlOptionsBase } from "./VfsTriggerCtrl";
import { vfsMntPtProvider } from "./vfs-deps";
import { createNotFoundVfsDirReadResult, getVfsSourceUrl, normalizeVfsPath, sortVfsMntPt, vfsTopic } from "./vfs-lib";
import { VfsConfig, VfsDirReadOptions, VfsDirReadRecursiveOptions, VfsDirReadResult, VfsItem, VfsItemChangeEvt, VfsItemGetOptions, VfsMntPt, VfsMntPtProviderConfig, VfsReadStream, VfsReadStreamWrapper, VfsShellCommand, VfsShellOutput, VfsShellPipeOutType, VfsWatchHandle, VfsWatchOptions } from "./vfs-types";

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
    public async canTouch(path:string){return (await this.getMntCtrlAsync(path))?.canTouch??false}
    public async canExecShellCmd(path:string){return (await this.getMntCtrlAsync(path))?.canExecShellCmd??false}

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
        path=normalizeVfsPath(path);
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

        let ctrl:VfsMntCtrl|undefined=this.mntCtrlLookup[mnt.type];
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
        path=normalizeVfsPath(path);
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
     * Touches a file either creating it or trigging a change
     */
    public async touchAsync(path:string):Promise<VfsItem|undefined>
    {
        path=normalizeVfsPath(path);
        const mnt=this.getMntPt(path);
        if(!mnt){
            return undefined;
        }
        const ctrl=await this.getMntCtrlAsync(mnt);
        if(!ctrl){
            return undefined;
        }
        return await ctrl.touchAsync(this,mnt,path,getVfsSourceUrl(mnt,path));
    }

    /**
     * Gets a single item by path.
     */
    public async getItemAsync(path:string,options?:VfsItemGetOptions):Promise<VfsItem|undefined>
    {
        path=normalizeVfsPath(path);

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

    public async getSourceUrl(path:string){
        path=normalizeVfsPath(path);

        const mnt=this.getMntPt(path);
        if(!mnt){
            return undefined;
        }
        return getVfsSourceUrl(mnt,path);
    }

    public async readDirAsync(options:VfsDirReadOptions|string):Promise<VfsDirReadResult>
    {
        if(typeof options === 'string'){
            options={path:options}
        }
        if(options.path.includes('*') && !options.filter?.match){
            let path=normalizeVfsPath(options.path);
            const div=path.lastIndexOf('/');
            const s=path.lastIndexOf('*');
            if(s>div){
                options={
                    ...options,
                    path:path.substring(0,div),
                    filter:{
                        ...options.filter,
                        match:path.substring(div+1),
                    }
                }
            }
        }
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

    public async enumDirAsync(
        options:VfsDirReadOptions|string,
        callback:(result:VfsDirReadResult)=>void|boolean|Promise<void|boolean>,
        cancel?:CancelToken
    ):Promise<number>{
        if(typeof options === 'string'){
            options={path:options}
        }else{
            options={...options}
        }
        if(options.offset===undefined){
            options.offset=0;
        }
        let total=0;
        while(!cancel?.isCanceled){
            const r=await this.readDirAsync(options);
            if(cancel?.isCanceled){
                return total;
            }
            total+=r.count;
            const _continue=await callback(r);
            if(_continue===false || total>=r.total){
                return total;
            }
        }
        return total;
    }

    public async readDirRecursiveAsync(options:VfsDirReadRecursiveOptions|string):Promise<VfsDirReadResult>
    {
        const items:VfsItem[]=[];

        if(typeof options === 'string'){
            options={path:options}
        }

        await this._readDirRecursiveAsync(0,options.path,{value:0},options.offset??0,items,options);

        items.sort((a,b)=>a.path.localeCompare(b.path));

        return {
            items,
            offset:0,
            count:items.length,
            total:items.length,
            notFound:false,
        }
    }

    private async _readDirRecursiveAsync(
        depth:number,
        path:string,
        count:ValueRef<number>,
        offset:number,
        items:VfsItem[],
        options:VfsDirReadRecursiveOptions
    ):Promise<void>{
        if( (options.maxDepth!==undefined && depth>=options.maxDepth) ||
            (options.limit!==undefined && items.length>=options.limit)
        ){
            return;
        }

        const r=await this.readDirAsync({
            path,
            limit:options.limit===undefined?undefined:options.limit-items.length,
            filter:options.filter
        });

        if(r.items){
            for(const item of r.items){
                if(options.excludeDirectories && item.type==='dir'){
                    continue;
                }
                count.value++;
                if(count.value>offset){
                    items.push(item);
                    if(options.limit!==undefined && items.length>=options.limit){
                        return;
                    }
                }
            }
            for(const item of r.items){
                if(item.type!=='dir'){
                    continue;
                }
                await this._readDirRecursiveAsync(
                    depth+1,
                    item.path,
                    count,
                    offset,
                    items,
                    options,
                )
                if(options.limit!==undefined && items.length>=options.limit){
                    return;
                }
            }
        }
    }


    public async mkDirAsync(path:string):Promise<VfsItem>
    {
        path=normalizeVfsPath(path);

        const mnt=this.getMntPt(path);
        if(!mnt){
            throw new Error(`No mount point found for path ${path}`);
        }
        const ctrl=await this.requireMntCtrlAsync(mnt);
        return await ctrl.mkDirAsync(this,mnt,path,getVfsSourceUrl(mnt,path));
    }
    public async removeAsync(path:string):Promise<VfsItem>
    {
        path=normalizeVfsPath(path);

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
    public async readObjectAsync<T=any>(path:string):Promise<T|undefined>{

        let value:any;

        try{
            value=await this.readStringAsync(path);
        }catch{
            return undefined;
        }

        try{
            return JSON.parse(value);
        }catch(ex){
            console.error(`Parse loaded vfs value failed. path:${path}`,ex);
            return undefined;
        }


    }
    public async readStringAsync(path:string):Promise<string>
    {
        path=normalizeVfsPath(path);

        const mnt=this.getMntPt(path);
        if(!mnt){
            throw new Error(`No mount point found for path ${path}`);
        }
        const ctrl=await this.requireMntCtrlAsync(mnt);
        return await ctrl.readStringAsync(this,mnt,path,getVfsSourceUrl(mnt,path));
    }
    public async writeStringAsync(path:string,content:string):Promise<VfsItem>
    {
        path=normalizeVfsPath(path);

        const mnt=this.getMntPt(path);
        if(!mnt){
            throw new Error(`No mount point found for path ${path}`);
        }
        const ctrl=await this.requireMntCtrlAsync(mnt);
        return await ctrl.writeStringAsync(this,mnt,path,getVfsSourceUrl(mnt,path),content);
    }
    public async writeObjectAsync(path:string,value:any):Promise<VfsItem>
    {
        return await this.writeStringAsync(path,JSON.stringify(value));
    }
    public async appendStringAsync(path:string,content:string):Promise<VfsItem>
    {
        path=normalizeVfsPath(path);

        const mnt=this.getMntPt(path);
        if(!mnt){
            throw new Error(`No mount point found for path ${path}`);
        }
        const ctrl=await this.requireMntCtrlAsync(mnt);
        return await ctrl.appendStringAsync(this,mnt,path,getVfsSourceUrl(mnt,path),content);
    }
    public async readBufferAsync(path:string):Promise<Uint8Array>
    {
        path=normalizeVfsPath(path);

        const mnt=this.getMntPt(path);
        if(!mnt){
            throw new Error(`No mount point found for path ${path}`);
        }
        const ctrl=await this.requireMntCtrlAsync(mnt);
        return await ctrl.readBufferAsync(this,mnt,path,getVfsSourceUrl(mnt,path));
    }
    public writeBase64Async(path:string,base64OrDataUri:string):Promise<VfsItem>
    {
        const i=base64OrDataUri.lastIndexOf(',');
        if(i!==-1){
            base64OrDataUri=decodeURIComponent(base64OrDataUri.substring(i+1));
        }
        const buffer=Buffer.from(base64OrDataUri,'base64');
        return this.writeBufferAsync(path,buffer);
    }
    public async writeFileAsync(path:string,appendFileNameToPath:boolean,file:File):Promise<VfsItem>
    {
        path=normalizeVfsPath(path);
        if(appendFileNameToPath){
            if(!file.name){
                throw new Error('File does not have a name to append');
            }
            path=joinPaths(path,file.name);
        }
        return await this.writeBufferAsync(path,new Blob([file]));
    }
    public async writeBufferAsync(path:string,buffer:Uint8Array|Blob|Blob[]|string):Promise<VfsItem>
    {
        path=normalizeVfsPath(path);

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
        path=normalizeVfsPath(path);

        const mnt=this.getMntPt(path);
        if(!mnt){
            throw new Error(`No mount point found for path ${path}`);
        }
        const ctrl=await this.requireMntCtrlAsync(mnt);
        return await ctrl.writeStreamAsync(this,mnt,path,getVfsSourceUrl(mnt,path),stream);
    }
    public async getReadStreamAsync(path:string):Promise<VfsReadStreamWrapper>
    {
        path=normalizeVfsPath(path);

        const mnt=this.getMntPt(path);
        if(!mnt){
            throw new Error(`No mount point found for path ${path}`);
        }
        const ctrl=await this.requireMntCtrlAsync(mnt);
        return await ctrl.getReadStreamAsync(this,mnt,path,getVfsSourceUrl(mnt,path));
    }

    public async execShellCmdAsync(cmd:VfsShellCommand):Promise<VfsShellOutput>
    {
        if(!this.config.allowExec){
            throw new UnauthorizedError('Shell command execution is not allowed at the controller level');
        }
        const cwd=normalizeVfsPath(cmd.cwd??'~');

        const mnt=this.getMntPt(cwd);
        if(!mnt){
            throw new Error(`No mount point found for path ${cwd}`);
        }
        if(!mnt.allowExec){
            throw new UnauthorizedError(`Shell command execution is not allowed at the mount path level. cwd:${cwd}`);
        }
        cmd={...cmd,cwd:getVfsSourceUrl(mnt,cwd)||'/'};
        const ctrl=await this.requireMntCtrlAsync(mnt);
        return await ctrl.execShellCmdAsync(cmd,this.pipeOut);
    }

    public async getPipeOutputAsync(cwd:string|undefined|null,pipeId:string):Promise<Record<string,string[]>|undefined>{

        const localPipe=this.pipes[pipeId];
        if(localPipe){
            const out=localPipe.out;
            if(this.config.enablePipeWaiting && !Object.keys(out).length){
                return await this.waitForPipeOutputAsync(pipeId);
            }
            localPipe.out={};
            return out;
        }

        cwd=normalizeVfsPath(cwd??'~');
        const mnt=this.getMntPt(cwd);
        if(!mnt){
            throw new Error(`No mount point found for path ${cwd}`);
        }
        cwd=getVfsSourceUrl(mnt,cwd);
        const ctrl=await this.requireMntCtrlAsync(mnt);
        return await ctrl.getPipeOutputAsync(cwd,pipeId);
    }

    private waitForPipeOutputAsync(pipeId:string):Promise<Record<string,string[]>|undefined>{
        return new Promise<Record<string,string[]>|undefined>((resolve)=>{
            let m=true;
            const iv=setTimeout(()=>{
                if(!m){
                    return;
                }
                m=false;
                delete this.pipeCallbacks[pipeId];
                resolve(undefined);
            },20000);

            this.pipeCallbacks[pipeId]=v=>{
                clearTimeout(iv);
                if(!m){
                    return;
                }
                m=false;
                delete this.pipeCallbacks[pipeId];
                resolve(v);
            };
        })
    }

    private readonly pipeOut=(type:VfsShellPipeOutType,pipeId:string,out:string)=>{
        const pipe=this.pipes[pipeId]??(this.pipes[pipeId]={
            id:pipeId,
            ttl:Date.now()+pipeTtl,
            out:{}
        });
        pipe.ttl=Date.now()+pipeTtl;
        const callback=this.pipeCallbacks[pipeId];
        if(callback){
            delete this.pipeCallbacks[pipeId];
            callback({[type]:[out]})
        }else{
            (pipe.out[type]??(pipe.out[type]=[])).push(out);
        }
        this.startPipeCleanUp();
    }

    private pipeCleanUpActive=false;
    private readonly pipes:Record<string,Pipe>={};
    private readonly pipeCallbacks:Record<string,(out:Record<string,string[]>)=>void>={};
    private startPipeCleanUp()
    {
        if(this.pipeCleanUpActive){
            return;
        }
        this.pipeCleanUpActive=true;
        const iv=setInterval(()=>{
            if(this.isDisposed || !this.cleanUpPipes()){
                this.pipeCleanUpActive=false;
                clearInterval(iv);
            }
        },minuteMs);
    }

    /**
     * Returns true if there are pipe left to clean up.
     */
    private cleanUpPipes(){
        let active=false;
        const now=Date.now();
        for(const e in this.pipes){
            const pipe=this.pipes[e];
            if(!pipe){
                continue;
            }
            if(pipe.ttl<now){
                delete this.pipes[e];
                delete this.pipeCallbacks[e];
            }else{
                active=true;
            }
        }
        return active;
    }

}

const pipeTtl=10*minuteMs;

interface Pipe
{
    id:string;
    ttl:number;
    out:Record<string,string[]>;
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
