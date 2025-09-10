import { NotFoundError, UnsupportedError, asArray, getContentType, getFileName } from "@iyio/common";
import { VfsCtrl } from "./VfsCtrl.js";
import { VfsMntCtrl, VfsMntCtrlOptions } from "./VfsMntCtrl.js";
import { createNotFoundVfsDirReadResult, defaultVfsIgnoreFiles, testVfsFilter, vfsMntTypes } from "./vfs-lib.js";
import { VfsDirReadOptions, VfsDirReadResult, VfsItem, VfsItemGetOptions, VfsMntPt } from "./vfs-types.js";

export const defaultVfsIndexDbDbName='vfsFileSystem';

const fileSystemStoreName='files';
const dataStoreName='data';
const pathKey='path';
const dbVersion=4;

const textDecoder=new TextDecoder();
const textEncoder=new TextEncoder();



const createFile=(path:string,size:number):VfsItem=>{
    const now=Date.now();
    const entry:VfsItem={
        id:path,
        path,
        name:getFileName(path),
        size:size,
        type:'file',
        contentType:getContentType(path),
    }
    return entry;
}
const createDir=(path:string):VfsItem=>{
    const now=Date.now();
    const entry:VfsItem={
        id:path,
        path,
        name:getFileName(path),
        type:'dir',
    }
    return entry;
}



interface TransParams<Value=any,Request=any>
{
    value?:Value;
    error?:any;
    store:IDBObjectStore;
    fileSystemStore?:IDBObjectStore;
    dataStore?:IDBObjectStore;
    trans:IDBTransaction;
    db:IDBDatabase;
    next:(request:IDBRequest<Request>|(IDBRequest<Request>|null|undefined)[],nextCb?:TransCallback<Request>)=>void;
}
type TransCallback<Value=any,Request=any>=(params:TransParams<Value,Request>)=>void;

type TBuffer=ArrayBuffer;
const createBuffer=(size:number):TBuffer=>new ArrayBuffer(size);
const uint8ToBuffer=(ary:Uint8Array):TBuffer=>ary.buffer as any;
const bufferToTBufferAsync=(buffer:Uint8Array|Blob):Promise<TBuffer>=>{
    if(buffer instanceof Blob){
        return buffer.arrayBuffer();
    }else{
        return Promise.resolve(buffer.buffer) as any;
    }
}


export interface VfsIndexDbMntCtrlOptions extends VfsMntCtrlOptions
{
    ignoreFilenames?:string[];

    /**
     * Name of the IndexDB database to open
     * @default "vfsFileSystem"
     */
    dbName?:string;
}

/**
 * Mounts files stored on a hard drive
 */
export class VfsIndexDbMntCtrl extends VfsMntCtrl
{

    private readonly ignoreFilenames:string[];

    private readonly dbName:string;

    public constructor({
        ignoreFilenames=defaultVfsIgnoreFiles,
        dbName=defaultVfsIndexDbDbName,
        ...options
    }:VfsIndexDbMntCtrlOptions={}){
        super({
            ...options,
            type:vfsMntTypes.indexDb,
            removeProtocolFromSourceUrls:true,
        })
        this.ignoreFilenames=ignoreFilenames;
        this.dbName=dbName;
        if(!globalThis.indexedDB){
            throw new UnsupportedError('VfsIndexDbMntCtrl relies on indexedDB but indexedDB is done defined in global scope');
        }
    }

    private versionChanged=false;
    private dbPromise?:Promise<IDBDatabase>;
    private async getDbAsync():Promise<IDBDatabase>{

        if(this.versionChanged){
            throw new Error('VfsIndexDbMntCtrl db version changed. Plead reload window');
        }

        return this.dbPromise??(this.dbPromise=new Promise<IDBDatabase>((resolve,reject)=>{
            const openRequest=globalThis.indexedDB.open(this.dbName,dbVersion);
            openRequest.addEventListener('error',(err)=>{
                console.error('VfsIndexDbMntCtrl open err',err);
                reject(err);
            });
            openRequest.addEventListener('blocked',(err)=>{
                console.error('VfsIndexDbMntCtrl open blocked',err);
                reject(err);
            });
            openRequest.addEventListener('success',()=>{
                if(openRequest.result){
                    let db:IDBDatabase;
                    try{
                        db=openRequest.result
                    }catch(ex){
                        reject(ex);
                        return;
                    }
                    this.disposables.addCb(()=>{
                        db.close();
                    })
                    db.addEventListener('versionchange',evt=>{
                        db.close();
                        this.versionChanged=true;
                        console.warn('VfsIndexDbMntCtrl db changed',evt);
                    });
                    db.addEventListener('error',(err)=>{
                        console.error('VfsIndexDbMntCtrl db error',err);
                    })
                    resolve(db);
                }else{
                    reject('database on present on request object');
                }
            })
            openRequest.addEventListener('upgradeneeded',()=>{

                try{

                    const db=openRequest.result;
                    if(!db){
                        throw new Error("openRequest result empty");
                    }

                    db.createObjectStore(fileSystemStoreName,{keyPath:pathKey});

                    db.createObjectStore(dataStoreName);
                }catch(ex){
                    console.error('VfsIndexDbMntCtrl upgrade db failed',ex);
                    reject(ex);

                }
            });
        }));
    }

    private runTransactionAsync<T extends any[]>(mode:IDBTransactionMode,storeType:'fs'|'data'|'both',callback:TransCallback){
        return new Promise<{value:any,error:any}>((resolve,reject)=>{
            let callCount=0;
            this.getDbAsync().then(db=>{
                const trans=db.transaction(storeType==='both'?[fileSystemStoreName,dataStoreName]:storeType==='fs'?fileSystemStoreName:dataStoreName,mode);
                const fileSystemStore=storeType!=='data'?trans.objectStore(fileSystemStoreName):undefined;
                const dataStore=storeType!=='fs'?trans.objectStore(dataStoreName):undefined;
                const step=(cb:TransCallback,value:any,error:any)=>{
                    const startCount=callCount;
                    cb({
                        store:(fileSystemStore??dataStore) as IDBObjectStore,
                        fileSystemStore,
                        dataStore,
                        value,
                        error,
                        trans,
                        db,
                        next:(request,next)=>{
                            callCount++;
                            if(!request){
                                resolve({value:undefined,error:undefined});
                                return;
                            }
                            const ary=(asArray(request)?.filter(v=>v)??[]) as IDBRequest<any>[];
                            let count=0;
                            const results:any[]=[];
                            const errors:any[]=[];
                            const listener=(evt:any,index:number)=>{
                                const r=evt.target as IDBRequest;
                                count++;
                                results[index]=r.result;
                                errors[index]=r.error;
                                if(count!==ary.length){
                                    return;
                                }
                                const v=ary.length===1?results[0]:results;
                                const e=ary.length===1?errors[0]:errors;
                                if(next){
                                    step(next,v,e);
                                }else{
                                    resolve({value:v,error:e});
                                }
                            }
                            for(let i=0;i<ary.length;i++){
                                const r=ary[i];
                                if(!r){continue}
                                ((index:number)=>{
                                    r.addEventListener('success',evt=>listener(evt,index));
                                    r.addEventListener('error',evt=>listener(evt,index));
                                })(i);
                            }
                        }
                    });
                    if(callCount!=startCount+1){
                        reject(`IndexDB transaction next not call exactly 1 time. expected:${startCount+1}, received:${callCount}`);
                    }
                }
                step(callback,undefined,undefined);
            }).catch(reject);
        })
    }

    private async scanAsync<T>(storeName:string,filter:(item:T)=>boolean,mode:IDBTransactionMode='readonly'):Promise<T[]>{
        const db=await this.getDbAsync();
        return await new Promise<T[]>((resolve,reject)=>{
            const trans=db.transaction(storeName,mode);
            const store=trans.objectStore(storeName);
            const cursor=store.openCursor();
            const values:T[]=[];
            cursor.addEventListener('success',(evt)=>{
                const value=(evt as any).target?.result?.value;
                if(value){
                    if(filter(value)){
                        values.push(value);
                    }
                    (evt as any).target?.result?.continue();
                }else{
                    resolve(values);
                }
            })
            cursor.addEventListener('error',(err)=>{
                reject(err);
            })
        })

    }

    protected override _touchAsync=async (fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined):Promise<VfsItem>=>{

        if(!sourceUrl){
            throw new Error('sourceUrl required');
        }

        await this.runTransactionAsync('readwrite','fs',({store,next})=>{
            const getFile=store.get(sourceUrl);
            next(getFile,({value})=>{
                if(value===undefined){
                    next(store.put(createFile(sourceUrl,0)));
                }
            })
        })

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
        return await this.getItemByPath(sourceUrl);
    }

    private async getItemByPath(path:string):Promise<VfsItem|undefined>{

        const {value}=await this.runTransactionAsync('readonly','fs',({next,store})=>{
            next(store.get(path))
        })

        return value;
    }

    protected override _readDirAsync=async (fs:VfsCtrl,mnt:VfsMntPt,options:VfsDirReadOptions,sourceUrl:string|undefined):Promise<VfsDirReadResult>=>
    {
        if(!sourceUrl){
            return createNotFoundVfsDirReadResult(options);
        }
        if(!sourceUrl.endsWith('/')){
            sourceUrl+='/';
        }

        const srcPath=sourceUrl;

        // if(sourceUrl!=='/'){
        //     try{
        //         const s=await this.getItemByPath(sourceUrl);
        //         if(s?.type!=='dir'){
        //             return createNotFoundVfsDirReadResult(options);
        //         }
        //     }catch{
        //         return createNotFoundVfsDirReadResult(options);
        //     }
        // }
        const itemsSource=await this.scanAsync<VfsItem>(fileSystemStoreName,item=>{
            return item.path.startsWith(srcPath) && !this.ignoreFilenames.includes(item.name) && testVfsFilter(item.name,options.filter)
        })

        const items=(options.limit!==undefined || options.offset!==undefined)?(
            itemsSource.slice(options.offset??0,(options.offset??0)+(options.limit??itemsSource.length))
        ):itemsSource;

        return {
            items,
            offset:options.offset??0,
            count:items.length,
            total:itemsSource.length,
            notFound:false,
        }

    }

    protected override _mkDirAsync=async (fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined):Promise<VfsItem>=>
    {
        if(!sourceUrl){
            throw new Error('sourceUrl required');
        }
         await this.runTransactionAsync('readwrite','fs',({store,next})=>{
            const getFile=store.get(sourceUrl);
            next(getFile,({value})=>{
                if(value===undefined){
                    next(store.put(createDir(sourceUrl)));
                }
            })
        })

        const item=await this._getItemAsync(fs,mnt,path,sourceUrl);
        if(!item){
            throw new Error('Unable to created dir');
        }
        return item;
    }

    protected override _removeAsync=async (fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined):Promise<VfsItem>=>
    {
        if(!sourceUrl){
            throw new Error('sourceUrl required');
        }
        const item=await this.getItemByPath(sourceUrl);
        if(!item){
            throw new NotFoundError();
        }
        await this.runTransactionAsync('readwrite','both',({next,fileSystemStore,dataStore})=>{
            if(!fileSystemStore){
                return;
            }
            next(fileSystemStore.delete(sourceUrl),({next})=>{
                if(!dataStore){
                    return;
                }
                next(dataStore.delete(sourceUrl));
            })
        })
        return item;
    }

    private async _readAsync(sourceUrl:string|undefined):Promise<TBuffer>
    {
        if(!sourceUrl){
            throw new Error('sourceUrl required');
        }
        let item:VfsItem|undefined;
        const {value}=await this.runTransactionAsync('readonly','both',({next,fileSystemStore,dataStore})=>{
            if(fileSystemStore){
                next(fileSystemStore.get(sourceUrl),({next,value})=>{
                    item=value
                    if(dataStore){
                        next(dataStore.get(sourceUrl))
                    }
                })
            }
        });
        const data:TBuffer|undefined=value;

        if(!item){
            throw new NotFoundError(`File not found at ${sourceUrl}`);
        }

        if(item.type!=='file'){
            throw new Error(`Can not ready directory as file - ${sourceUrl}`);
        }

        return data??createBuffer(0);
    }

    protected override _readStringAsync=async (fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined):Promise<string>=>
    {
        return textDecoder.decode(await this._readAsync(sourceUrl));
    }

    protected override _writeStringAsync=async (fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined,content:string):Promise<VfsItem>=>
    {
        if(!sourceUrl){
            throw new Error('sourceUrl required');
        }

        await this.runTransactionAsync('readwrite','both',({next,fileSystemStore,dataStore})=>{
            const buf=uint8ToBuffer(textEncoder.encode(content));
            next([
                fileSystemStore?.put(createFile(sourceUrl,buf.byteLength)),
                dataStore?.put(buf,sourceUrl),
            ]);
        })

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
        const current=await this._readStringAsync(fs,mnt,path,sourceUrl);
        return await this._writeStringAsync(fs,mnt,path,sourceUrl,current+content);
    }

    protected override _readBufferAsync=async (fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined):Promise<Uint8Array>=>
    {
        const buff=await this._readAsync(sourceUrl);
        return new Uint8Array(buff);
    }

    protected override _writeBufferAsync=async (fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined,buffer:Uint8Array|Blob):Promise<VfsItem>=>
    {
        if(!sourceUrl){
            throw new Error('sourceUrl required');
        }

        const buf=await bufferToTBufferAsync(buffer);
        await this.runTransactionAsync('readwrite','both',({next,fileSystemStore,dataStore})=>{
            next([
                fileSystemStore?.put(createFile(sourceUrl,buf.byteLength)),
                dataStore?.put(buf,sourceUrl),
            ]);
        })

        const item=await this._getItemAsync(fs,mnt,path,sourceUrl);
        if(!item){
            throw new Error('Item to returned');
        }
        return item;
    }

    // protected override _writeStreamAsync=async (fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined,stream:VfsReadStream):Promise<VfsItem>=>
    // {
    //     if(!sourceUrl){
    //         throw new Error('sourceUrl required');
    //     }
    //     await this.makeDirectoryForFileAsync(sourceUrl);
    //     const writeStream=createWriteStream(sourceUrl,{flags:'w',autoClose:true});
    //     return await new Promise<VfsItem>((resolve,reject)=>{
    //         writeStream.on('open',()=>{
    //             stream.pipe(writeStream);
    //         })
    //         let error=false;
    //         writeStream.on('close',()=>{
    //             if(error){
    //                 return;
    //             }
    //             this._getItemAsync(fs,mnt,path,sourceUrl).then(item=>{
    //                 if(item){
    //                     resolve(item);
    //                 }else{
    //                     reject(new Error('Item to returned'))
    //                 }
    //             }).catch(err=>reject(err));
    //         })
    //         writeStream.on('error',err=>{
    //             error=true;
    //             reject(err);
    //         })
    //     })
    // }

    // protected override _getReadStream=(fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined):Promise<VfsReadStreamWrapper>=>
    // {
    //     if(!sourceUrl){
    //         throw new Error('sourceUrl required');
    //     }
    //     return new Promise<VfsReadStreamWrapper>((resolve,reject)=>{
    //         stat(sourceUrl).then(s=>{
    //             try{
    //                 const fileStream=createReadStream(sourceUrl);
    //                 fileStream.on('open',()=>{
    //                     resolve({
    //                         stream:fileStream,
    //                         size:s.size,
    //                         contentType:getContentType(sourceUrl)
    //                     })
    //                 })
    //                 fileStream.on('error',err=>{
    //                     fileStream.destroy();
    //                 });
    //                 fileStream.on('end',()=>{
    //                     fileStream.destroy();
    //                 })
    //             }catch(ex){
    //                 reject(ex);
    //             }
    //         }).catch(err=>reject(err))
    //     })
    // }
}
