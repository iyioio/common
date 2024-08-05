import { DisposeContainer, deepClone } from "@iyio/common";
import { VfsMntCtrl } from "./VfsMntCtrl";
import { vfsMntPtProvider } from "./vfs-deps";
import { createNotFoundVfsDirReadResult, getVfsSourceUrl, sortVfsMntPt } from "./vfs-lib";
import { VfsConfig, VfsDirReadOptions, VfsDirReadResult, VfsItem, VfsItemGetOptions, VfsMntPt, VfsMntPtProviderConfig, VfsReadStream, VfsReadStreamWrapper } from "./vfs-types";

export interface VfsCtrlOptions
{
    config:VfsConfig;
    /**
     * @default {searchRootScope:true}
     */
    mntProviderConfig?:VfsMntPtProviderConfig;

}

export class VfsCtrl
{

    private readonly config:VfsConfig;

    private readonly mntProviderConfig:VfsMntPtProviderConfig;

    /**
     * Returns a deep clone of the filesystem's config
     */
    public getConfig(){
        return deepClone(this.config);
    }

    public constructor({
        config,
        mntProviderConfig={searchRootScope:true}
    }:VfsCtrlOptions){
        this.config=deepClone(config);
        sortVfsMntPt(this.config.mountPoints);
        this.mntProviderConfig=mntProviderConfig;
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

    private readonly mntCtrlLookup:Record<string,VfsMntCtrl>={}
    private readonly mntCtrls:VfsMntCtrl[]=[];

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
        this.mntCtrls.push(ctrl);
        if(disposeWithFs){
            this.disposables.add(ctrl);
        }
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
    public async rmDirAsync(path:string):Promise<VfsItem>
    {
        const mnt=this.getMntPt(path);
        if(!mnt){
            throw new Error(`No mount point found for path ${path}`);
        }
        const ctrl=await this.requireMntCtrlAsync(mnt);
        return await ctrl.removeAsync(this,mnt,path,getVfsSourceUrl(mnt,path));
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
    public async writeStringAsync(path:string,content:string):Promise<void>
    {
        const mnt=this.getMntPt(path);
        if(!mnt){
            throw new Error(`No mount point found for path ${path}`);
        }
        const ctrl=await this.requireMntCtrlAsync(mnt);
        return await ctrl.writeStringAsync(this,mnt,path,getVfsSourceUrl(mnt,path),content);
    }
    public async appendStringAsync(path:string,content:string):Promise<void>
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
    public async writeBufferAsync(path:string,buffer:Uint8Array):Promise<void>
    {
        const mnt=this.getMntPt(path);
        if(!mnt){
            throw new Error(`No mount point found for path ${path}`);
        }
        const ctrl=await this.requireMntCtrlAsync(mnt);
        return await ctrl.writeBufferAsync(this,mnt,path,getVfsSourceUrl(mnt,path),buffer);
    }
    public async writeStreamAsync(path:string,stream:VfsReadStream):Promise<void>
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
