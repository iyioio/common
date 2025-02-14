import { DisposeContainer, UnsupportedError, getUriProtocol, joinPaths, removeUriProtocol } from "@iyio/common";
import { Observable, Subject } from "rxjs";
import { VfsCtrl } from "./VfsCtrl";
import { VfsDirReadOptions, VfsDirReadResult, VfsItem, VfsItemChangeEvt, VfsItemGetOptions, VfsMntPt, VfsReadStream, VfsReadStreamWrapper, VfsShellCommand, VfsShellOutput, VfsShellPipeOutType, VfsWatchHandle, VfsWatchOptions } from "./vfs-types";

export interface VfsMntCtrlOptionsBase
{
    type:string;
    removeProtocolFromSourceUrls?:boolean;
    addProtocolToSourceUrls?:string;
    sourceUrlPrefix?:string;
}

export interface VfsMntCtrlOptions
{

}

export abstract class VfsMntCtrl
{

    public readonly type:string;

    public get canGetItem(){return this._getItemAsync!==undefined}
    public get canReadDir(){return this._readDirAsync!==undefined}
    public get canMkDir(){return this._mkDirAsync!==undefined}
    public get canRmDir(){return this._removeAsync!==undefined}
    public get canReadString(){return this._readStringAsync!==undefined}
    public get canAppendString(){return this._appendStringAsync!==undefined}
    public get canWriteFile(){return this._writeStringAsync!==undefined}
    public get canReadBuffer(){return this._readBufferAsync!==undefined}
    public get canWriteBuffer(){return this._writeBufferAsync!==undefined}
    public get canWriteStream(){return this._writeStreamAsync!==undefined}
    public get canGetReadStream(){return this._getReadStream!==undefined}
    public get canWatch(){return this._watch!==undefined}
    public get canTouch(){return this._touchAsync!==undefined}
    public get canExecShellCmd(){return this._execShellCmdAsync!==undefined}

    protected readonly removeProtocolFromSourceUrls?:boolean;
    protected readonly addProtocolToSourceUrls?:string;
    protected readonly sourceUrlPrefix?:string;

    protected readonly _onItemsChange=new Subject<VfsItemChangeEvt>();
    public get onItemsChange():Observable<VfsItemChangeEvt>{return this._onItemsChange}


    protected constructor({
        type,
        removeProtocolFromSourceUrls,
        addProtocolToSourceUrls,
        sourceUrlPrefix,
    }:VfsMntCtrlOptions & VfsMntCtrlOptionsBase){
        this.type=type;
        this.removeProtocolFromSourceUrls=removeProtocolFromSourceUrls;
        this.addProtocolToSourceUrls=addProtocolToSourceUrls;
        this.sourceUrlPrefix=sourceUrlPrefix;
    }

    protected readonly disposables=new DisposeContainer();
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

    public formatSourceUrl(sourceUrl:string|undefined):string|undefined{
        if(sourceUrl===undefined){
            return undefined;
        }

        if(this.removeProtocolFromSourceUrls || this.sourceUrlPrefix){
            sourceUrl=removeUriProtocol(sourceUrl);
        }

        if(this.sourceUrlPrefix){
            sourceUrl=joinPaths(this.sourceUrlPrefix,sourceUrl);
        }

        if(this.addProtocolToSourceUrls && (this.removeProtocolFromSourceUrls || !getUriProtocol(sourceUrl))){
            sourceUrl=this.addProtocolToSourceUrls+'://'+sourceUrl;
        }

        return sourceUrl;
    }


    /**
     * Touches a file either creating it or trigging a change
     */
    public touchAsync(fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined):Promise<VfsItem>
    {
        if(!this._touchAsync){
            throw new UnsupportedError(`touchAsync not supported by mount controller of type ${this.type}`);
        }
        return this._touchAsync?.(fs,mnt,path,this.formatSourceUrl(sourceUrl));
    }

    protected readonly _touchAsync?:(fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined)=>Promise<VfsItem>;



    /**
     * Starts watching a directory. A watch handle is returned if watching successfully starts.
     */
    public watch(fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined,options?:VfsWatchOptions):VfsWatchHandle|undefined
    {
        return this._watch?.(fs,mnt,path,this.formatSourceUrl(sourceUrl),options);
    }

    protected readonly _watch?:(fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined,options?:VfsWatchOptions)=>VfsWatchHandle|undefined;



    /**
     * Gets a single item by path.
     */
    public getItemAsync(fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined,options?:VfsItemGetOptions):Promise<VfsItem|undefined>
    {
        if(!this._getItemAsync){
            throw new UnsupportedError(`getItemAsync not supported by mount controller of type ${this.type}`);
        }
        return this._getItemAsync(fs,mnt,path,this.formatSourceUrl(sourceUrl),options);
    }

    protected readonly _getItemAsync?:(fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined,options?:VfsItemGetOptions)=>Promise<VfsItem|undefined>;

    /**
     * Reads all items in a directory.
     */
    public readDirAsync(fs:VfsCtrl,mnt:VfsMntPt,options:VfsDirReadOptions,sourceUrl:string|undefined):Promise<VfsDirReadResult>
    {
        if(!this._readDirAsync){
            throw new UnsupportedError(`readDirAsync not supported by mount controller of type ${this.type}`);
        }
        return this._readDirAsync(fs,mnt,options,this.formatSourceUrl(sourceUrl));
    }

    protected readonly _readDirAsync?:(fs:VfsCtrl,mnt:VfsMntPt,options:VfsDirReadOptions,sourceUrl:string|undefined)=>Promise<VfsDirReadResult>;

    /**
     * Creates a new directory. If the directory already exists the existing item is returned.
     * directories are created recursively. If the directory can not be created an error is thrown.
     */
    public mkDirAsync(fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined):Promise<VfsItem>
    {
        if(!this._mkDirAsync){
            throw new UnsupportedError(`mkDirAsync not supported by mount controller of type ${this.type}`);
        }
        return this._mkDirAsync(fs,mnt,path,this.formatSourceUrl(sourceUrl));
    }

    protected readonly _mkDirAsync?:(fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined)=>Promise<VfsItem>;


    /**
     * Removes a directory or file and returns the removed item.
     */
    public removeAsync(fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined):Promise<VfsItem>
    {
        if(!this._removeAsync){
            throw new UnsupportedError(`removeAsync not supported by mount controller of type ${this.type}`);
        }
        return this._removeAsync(fs,mnt,path,this.formatSourceUrl(sourceUrl));

    }

    protected readonly _removeAsync?:(fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined)=>Promise<VfsItem>;

    /**
     * Reads a file as a string
     */
    public readStringAsync(fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined):Promise<string>
    {
        if(!this._readStringAsync){
            throw new UnsupportedError(`readStringAsync not supported by mount controller of type ${this.type}`);
        }
        return this._readStringAsync(fs,mnt,path,this.formatSourceUrl(sourceUrl));
    }

    protected readonly _readStringAsync?:(fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined)=>Promise<string>;

    /**
     * Write a string to a file
     */
    public writeStringAsync(fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined,content:string):Promise<VfsItem>
    {
        if(!this._writeStringAsync){
            throw new UnsupportedError(`writeStringAsync not supported by mount controller of type ${this.type}`);
        }
        return this._writeStringAsync(fs,mnt,path,this.formatSourceUrl(sourceUrl),content);
    }

    protected readonly _writeStringAsync?:(fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined,content:string)=>Promise<VfsItem>;

    /**
     * Appends a string to a file or creates the file is it does not exist
     */
    public appendStringAsync(fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined,content:string):Promise<VfsItem>
    {
        if(!this._appendStringAsync){
            throw new UnsupportedError(`appendStringAsync not supported by mount controller of type ${this.type}`);
        }
        return this._appendStringAsync(fs,mnt,path,this.formatSourceUrl(sourceUrl),content);
    }

    protected readonly _appendStringAsync?:(fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined,content:string)=>Promise<VfsItem>;


    /**
     * Reads a file as a Buffer
     */
    public readBufferAsync(fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined):Promise<Uint8Array>
    {
        if(!this._readBufferAsync){
            throw new UnsupportedError(`readBufferAsync not supported by mount controller of type ${this.type}`);
        }
        return this._readBufferAsync(fs,mnt,path,this.formatSourceUrl(sourceUrl));
    }

    protected readonly _readBufferAsync?:(fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined)=>Promise<Uint8Array>;


    /**
     * Writes a buffer to a file
     */
    public writeBufferAsync(fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined,buffer:Uint8Array|Blob):Promise<VfsItem>
    {
        if(!this._writeBufferAsync){
            throw new UnsupportedError(`writeBufferAsync not supported by mount controller of type ${this.type}`);
        }
        return this._writeBufferAsync(fs,mnt,path,this.formatSourceUrl(sourceUrl),buffer);
    }

    protected readonly _writeBufferAsync?:(fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined,buffer:Uint8Array|Blob)=>Promise<VfsItem>;


    /**
     * Writes a stream to a file
     */
    public writeStreamAsync(fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined,stream:VfsReadStream):Promise<VfsItem>
    {
        if(!this._writeStreamAsync){
            throw new UnsupportedError(`writeStreamAsync not supported by mount controller of type ${this.type}`);
        }
        return this._writeStreamAsync(fs,mnt,path,this.formatSourceUrl(sourceUrl),stream);
    }

    protected readonly _writeStreamAsync?:(fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined,stream:VfsReadStream)=>Promise<VfsItem>;


    /**
     * Get a read stream for reading the file
     */
    public getReadStreamAsync(fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined):Promise<VfsReadStreamWrapper>
    {
        if(!this._getReadStream){
            throw new UnsupportedError(`getReadStreamAsync not supported by mount controller of type ${this.type}`);
        }
        return this._getReadStream(fs,mnt,path,this.formatSourceUrl(sourceUrl));
    }

    protected readonly _getReadStream?:(fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined)=>Promise<VfsReadStreamWrapper>;


    public async execShellCmdAsync(cmd:VfsShellCommand,pipeOut:(type:VfsShellPipeOutType,pipeId:string,out:string)=>void):Promise<VfsShellOutput>
    {
        if(!this._execShellCmdAsync){
            throw new UnsupportedError(`execShellCmdAsync not supported by mount controller of type ${this.type}`);
        }
        return this._execShellCmdAsync(cmd,pipeOut);
    }

    protected readonly _execShellCmdAsync?:(cmd:VfsShellCommand,pipeOut:(type:VfsShellPipeOutType,pipeId:string,out:string)=>void)=>Promise<VfsShellOutput>;

    public getPipeOutputAsync(cwd:string|undefined|null,pipeId:string):Promise<Record<string,string[]>|undefined>
    {
        if(!this._getPipeOutputAsync){
            return Promise.resolve(undefined);
        }
        return this._getPipeOutputAsync(cwd,pipeId);

    }

    protected readonly _getPipeOutputAsync?:(cwd:string|undefined|null,pipeId:string)=>Promise<Record<string,string[]>|undefined>;

    public writeToPipeAsync(pipeId:string,value:string):Promise<boolean>{
        if(!this._writeToPipeAsync){
            return Promise.resolve(false);
        }
        return this._writeToPipeAsync(pipeId,value);
    }
    protected readonly _writeToPipeAsync?:(pipeId:string,value:string)=>Promise<boolean>;

}
