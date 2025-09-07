import { NotFoundError, getContentType, getDirectoryName, getFileName, joinPaths, shortUuid } from "@iyio/common";
import { execAsync, pathExistsAsync, spawnAsync } from "@iyio/node-common";
import { VfsCtrl, VfsDirReadOptions, VfsDirReadResult, VfsItem, VfsItemChangeType, VfsItemGetOptions, VfsItemType, VfsMntCtrl, VfsMntCtrlOptions, VfsMntPt, VfsReadStream, VfsReadStreamWrapper, VfsShellCommand, VfsShellOutput, VfsShellPipeOutType, VfsWatchHandle, VfsWatchOptions, createNotFoundVfsDirReadResult, defaultVfsIgnoreFiles, testInclusiveVfsPathFilter, testVfsFilter, vfsMntTypes, vfsSourcePathToVirtualPath } from "@iyio/vfs";
import { ChildProcess } from "child_process";
import chokidar from 'chokidar';
import { Dirent, createReadStream, createWriteStream } from "fs";
import { appendFile, mkdir, readFile, readdir, rename, rm, stat, unlink, writeFile } from "fs/promises";

export interface VfsDiskMntCtrlOptions extends VfsMntCtrlOptions
{
    ignoreFilenames?:string[];
}

/**
 * Mounts files stored on a hard drive
 */
export class VfsDiskMntCtrl extends VfsMntCtrl
{

    private readonly ignoreFilenames:string[];

    public constructor({
        ignoreFilenames=defaultVfsIgnoreFiles,
        ...options
    }:VfsDiskMntCtrlOptions={}){
        super({
            ...options,
            type:vfsMntTypes.file,
            removeProtocolFromSourceUrls:true,
        })
        this.ignoreFilenames=ignoreFilenames;
    }

    protected override _watch=(fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined,options?:VfsWatchOptions):VfsWatchHandle|undefined=>
    {
        if(!sourceUrl){
            return undefined;
        }

        try{
            const ignore=options?.ignore;
            const watcher=chokidar.watch(sourceUrl,{
                ignoreInitial:true,
                alwaysStat:true,
                depth:options?.recursive?undefined:0,
                ignored:ignore?(path:string)=>{
                    return testInclusiveVfsPathFilter(path,ignore);
                }:undefined
            })

            const trigger=(targetPath:string,path:string,type:VfsItemType,changeType:VfsItemChangeType)=>{
                if(ignore && testInclusiveVfsPathFilter(path,ignore)){
                    return;
                }
                console.info(`VfsDiskMntCtrl ${changeType} ${type} - ${path} -> ${targetPath}`);
                this._onItemsChange.next({
                    type:'vfsItemChange',
                    key:path,
                    value:{
                        changeType,
                        item:{
                            name:getFileName(path),
                            path,
                            type,
                            contentType:getContentType(path)
                        }
                    }
                })
            }

            watcher.on('all',(event, targetPath, stats)=>{

                const path=vfsSourcePathToVirtualPath(targetPath,mnt);
                if(!path){
                    return;
                }

                const changeType:VfsItemChangeType=(
                    event==='change'?
                        'change'
                    :event==='add' || event==='addDir'?
                        'add'
                    :
                        'remove'
                );

                if(stats){
                    trigger(targetPath,path,stats.isDirectory()?'dir':'file',changeType);
                }else{
                    stat(targetPath)
                        .then(s=>trigger(targetPath,path,s.isDirectory()?'dir':'file',changeType))
                        .catch(err=>console.error(`Get stats for ${targetPath} failed while watching mount`,err))
                }

            })
            // watcher.on('close',()=>{
            //     resolve();
            // })
            return {
                dispose:()=>{
                    watcher.close();
                }
            }
        }catch(ex){
            console.error('Unable to start directory watcher')
            return undefined;
        }
    }

    protected override _touchAsync=async (fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined):Promise<VfsItem>=>{
        if(!sourceUrl){
            throw new Error('sourceUrl required');
        }
        await this.makeDirectoryForFileAsync(sourceUrl);
        await execAsync(`touch '${sourceUrl.replace(/'/g,'')}'`);
        const item=await this._getItemAsync(fs,mnt,path,sourceUrl);
        if(!item){
            throw new Error('Unable to get touched file');
        }
        return item;
    }


    protected override _getItemAsync=async (fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined,options?:VfsItemGetOptions):Promise<VfsItem|undefined>=>
    {
        if(!sourceUrl){
            return undefined;
        }

        try{

            const s=await stat(sourceUrl);
            if(!s){
                return undefined;
            }

            const isDir=s.isDirectory();
            const name=getFileName(path);

            return {
                type:isDir?'dir':'file',
                path,
                name,
                size:isDir?undefined:s.size,
                contentType:isDir?getContentType(name):undefined,
            }

        }catch{
            return undefined;
        }
    }

    protected override _readDirAsync=async (fs:VfsCtrl,mnt:VfsMntPt,options:VfsDirReadOptions,sourceUrl:string|undefined):Promise<VfsDirReadResult>=>
    {
        if(!sourceUrl){
            return createNotFoundVfsDirReadResult(options);
        }

        try{
            const s=await stat(sourceUrl);
            if(!s?.isDirectory()){
                return createNotFoundVfsDirReadResult(options);
            }
        }catch{
            return createNotFoundVfsDirReadResult(options);
        }

        const dirItems=await readdir(sourceUrl,{withFileTypes:true});

        dirItems.sort((a,b)=>((a.isDirectory()?'a':'b')+a.name).localeCompare((b.isDirectory()?'a':'b')+b.name));

        const items:VfsItem[]=[];
        let total=0;

        //for(let i=options.offset??0;i<dirItems.length && items.length<(options.limit??dirItems.length);i++){
        for(let i=0;i<dirItems.length;i++){
            const item=dirItems[i] as Dirent;
            const name=getFileName(item.name);
            if(this.ignoreFilenames.includes(name) || (options.filter && !testVfsFilter(name,options.filter))){
                continue;
            }
            total++;
            if(i<(options.offset??0) || items.length>=(options.limit??dirItems.length)){
                continue;
            }
            const isDir=item.isDirectory();
            items.push({
                type:isDir?'dir':'file',
                path:joinPaths(options.path,item.name),
                name,
                contentType:isDir?undefined:getContentType(item.name),
            })
        }

        return {
            items,
            offset:options.offset??0,
            count:items.length,
            total,
            notFound:false,
        }

    }

    private async makeDirectoryForFileAsync(sourceUrl:string){
        const basePath=getDirectoryName(sourceUrl);
        if(!basePath || basePath===''){
            return;
        }
        if(!await pathExistsAsync(basePath)){
            await mkdir(basePath,{recursive:true})
        }
    }

    protected override _mkDirAsync=async (fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined):Promise<VfsItem>=>
    {
        if(!sourceUrl){
            throw new Error('sourceUrl required');
        }
        await mkdir(sourceUrl,{recursive:true});
        const item=await this._getItemAsync(fs,mnt,path,sourceUrl);
        if(!item){
            throw new Error('unable to get item info for new directory');
        }
        return item;
    }

    protected override _removeAsync=async (fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined):Promise<VfsItem>=>
    {
        if(!sourceUrl){
            throw new Error('sourceUrl required');
        }
        const item=await this._getItemAsync(fs,mnt,path,sourceUrl);
        if(!item){
            throw new NotFoundError();
        }
        if(item.type==='dir'){
            await rm(sourceUrl,{recursive:true,force:true});
        }else{
            await unlink(sourceUrl);
        }
        return item;
    }

    private async _readAsync(sourceUrl:string|undefined):Promise<Buffer>
    {
        if(!sourceUrl){
            throw new Error('sourceUrl required');
        }
        if(!await pathExistsAsync(sourceUrl)){
            throw new NotFoundError();
        }
        return await readFile(sourceUrl);
    }

    protected override _readStringAsync=async (fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined):Promise<string>=>
    {
        return (await this._readAsync(sourceUrl)).toString()
    }

    protected override _writeStringAsync=async (fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined,content:string):Promise<VfsItem>=>
    {
        if(!sourceUrl){
            throw new Error('sourceUrl required');
        }
        await this.makeDirectoryForFileAsync(sourceUrl);
        await writeMoveFileAsync(sourceUrl,content);
        const item=await this._getItemAsync(fs,mnt,path,sourceUrl);
        if(!item){
            throw new Error('Item to returned');
        }
        return item;
    }

    protected override _appendStringAsync=async (fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined,content:string):Promise<VfsItem>=>
    {
        if(!sourceUrl){
            throw new Error('sourceUrl required');
        }
        await this.makeDirectoryForFileAsync(sourceUrl);
        await appendFile(sourceUrl,content);
        const item=await this._getItemAsync(fs,mnt,path,sourceUrl);
        if(!item){
            throw new Error('Item to returned');
        }
        return item;
    }

    protected override _readBufferAsync=(fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined):Promise<Uint8Array>=>
    {
        return this._readAsync(sourceUrl) as any;
    }

    protected override _writeBufferAsync=async (fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined,buffer:Uint8Array|Blob):Promise<VfsItem>=>
    {
        if(!sourceUrl){
            throw new Error('sourceUrl required');
        }
        await this.makeDirectoryForFileAsync(sourceUrl);
        await writeMoveFileAsync(sourceUrl,(buffer instanceof Blob)?new Uint8Array(await buffer.arrayBuffer()):buffer);
        const item=await this._getItemAsync(fs,mnt,path,sourceUrl);
        if(!item){
            throw new Error('Item to returned');
        }
        return item;
    }

    protected override _writeStreamAsync=async (fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined,stream:VfsReadStream):Promise<VfsItem>=>
    {
        if(!sourceUrl){
            throw new Error('sourceUrl required');
        }
        await this.makeDirectoryForFileAsync(sourceUrl);
        const tmp=getTmpName(sourceUrl);
        const writeStream=createWriteStream(tmp,{flags:'w',autoClose:true});
        return await new Promise<VfsItem>((resolve,reject)=>{
            writeStream.on('open',()=>{
                stream.pipe(writeStream);
            })
            let error=false;
            writeStream.on('close',()=>{
                if(error){
                    return;
                }
                try{
                    rename(tmp,sourceUrl).then(()=>{
                        this._getItemAsync(fs,mnt,path,sourceUrl).then(item=>{
                            if(item){
                                resolve(item);
                            }else{
                                reject(new Error('Item to returned'))
                            }
                        }).catch(err=>reject(err));
                    }).catch(err=>reject(err));
                }catch(ex){
                    reject(ex);
                }
            })
            writeStream.on('error',err=>{
                error=true;
                reject(err);
            })
        })
    }

    protected override _getReadStream=(fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined):Promise<VfsReadStreamWrapper>=>
    {
        if(!sourceUrl){
            throw new Error('sourceUrl required');
        }
        return new Promise<VfsReadStreamWrapper>((resolve,reject)=>{
            stat(sourceUrl).then(s=>{
                try{
                    const fileStream=createReadStream(sourceUrl);
                    fileStream.on('open',()=>{
                        resolve({
                            stream:fileStream,
                            size:s.size,
                            contentType:getContentType(sourceUrl)
                        })
                    })
                    fileStream.on('error',err=>{
                        fileStream.destroy();
                    });
                    fileStream.on('end',()=>{
                        fileStream.destroy();
                    })
                }catch(ex){
                    reject(ex);
                }
            }).catch(err=>reject(err))
        })
    }

    private readonly procMap:Record<string,ChildProcess>={}

    protected override readonly _execShellCmdAsync=async (cmd:VfsShellCommand,pipeOut:(type:VfsShellPipeOutType,pipeId:string,out:string)=>void):Promise<VfsShellOutput>=>{
        const output:string[]=[];
        const errorOutput:string[]=[];
        let exitCode=0;
        const onOutput=(cmd.discardOutput || (cmd.returnImmediately && !cmd.outputStreamId))?undefined:(type:string,out:string)=>{
            if(!cmd.discardOutput && type==='out'){
                output.push(out);
            }
            pipeOut(type as any,cmd.outputStreamId as string,out);
        }
        const p=spawnAsync({
            cmd:cmd.shellCmd,
            cwd:cmd.cwd,
            onOutput,
            onExit:c=>{
                if(cmd.outputStreamId){
                    delete this.procMap[cmd.outputStreamId];
                }
                exitCode=c;
                if(cmd.outputStreamId){
                    pipeOut('exit',cmd.outputStreamId,c.toString());
                }
            },
            cancel:cmd.cancel,
            silent:cmd.noLog,
            logPid:true,
            onChild:child=>{
                if(cmd.outputStreamId){
                    this.procMap[cmd.outputStreamId]=child;
                }
            }
        });

        if(cmd.returnImmediately){
            return {
                output:'',
                exitCode:0,
            }
        }

        await p;
        const result:VfsShellOutput={
            exitCode,
            output:output.join(''),
        }
        if(errorOutput){
            result.errorOutput=errorOutput.join('')
        }
        return result;

    }

    protected override _writeToPipeAsync=(pipeId:string,value:string):Promise<boolean>=>
    {
        const proc=this.procMap[pipeId];
        if(!proc?.stdin){
            return Promise.resolve(false);
        }
        return new Promise<boolean>((resolve,reject)=>{
            proc.stdin?.write(value,(err)=>{
                if(err){
                    reject(err);
                }else{
                    resolve(true);
                }
            })
        })
    }
}

const getTmpName=(path:string)=>{
    const dir=getDirectoryName(path);
    return joinPaths(dir,`.tmp.${getFileName(path).substring(0,30)}--${shortUuid()}`);
}

const writeMoveFileAsync=async (path:string,data:string|Uint8Array)=>{
    const tmpPath=getTmpName(path);
    await writeFile(tmpPath,data);
    await rename(tmpPath,path);
}
