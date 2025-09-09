import { CancelToken, defineNumberParam, defineStringParam, delayAsync, HashMap, JsonStore, JsonStoreOptions, Scope, ValuePointer } from "@iyio/common";
import { mkdir, readFile, unlink, watch, writeFile } from 'node:fs/promises';
import { join } from "node:path";
import { pathExistsAsync } from "./fs";

export const defaultFsStoreDataDir='fs-store-data';

export const fsStoreKeyPrefixParam=defineStringParam('fsStoreKeyPrefix');
export const fsStoreDataDirectoryParam=defineStringParam('fsStoreDataDirectory');
export const fsStoreWatchDebounceDelayMsParam=defineNumberParam('fsStoreWatchDebounceDelayMs');

export interface FsStoreOptions extends JsonStoreOptions
{
    keyPrefix?:string;
    dataDirectory?:string;
    watchDebounceDelayMs?:number;
}

export class FsStore<T=any> extends JsonStore<T>
{

    public static optionsFromScope(scope:Scope):FsStoreOptions{
        return {
            keyPrefix:scope.to(fsStoreKeyPrefixParam).get(),
            dataDirectory:scope.to(fsStoreDataDirectoryParam).get(),
            watchDebounceDelayMs:scope.to(fsStoreWatchDebounceDelayMsParam).get(),
        }
    }

    public static fromScope(scope:Scope):FsStore
    {
        return new FsStore(FsStore.optionsFromScope(scope));
    }

    private readonly keyPrefix:string;
    private readonly dataDir:string;
    private readonly watchDebounceDelayMs:number;
    private checkedDir=false;

    public constructor(options?:FsStoreOptions)
    {
        super(options);
        this.keyPrefix=options?.keyPrefix??'';
        this.dataDir=options?.dataDirectory||defaultFsStoreDataDir;
        this.watchDebounceDelayMs=options?.watchDebounceDelayMs??100;
    }

    public override dispose(): void {
        if(this.isDisposed){
            return;
        }
        super.dispose();
        this.disposeCancel.cancelNow();
    }

    private disposeCancel:CancelToken=new CancelToken();

    public keyToPath(key:string)
    {
        return join(this.dataDir,encodeURIComponent(this.keyPrefix+key));
    }

    protected async getValue(key: string): Promise<string | undefined> {
        const path=this.keyToPath(key);
        if(!await pathExistsAsync(path)){
            return undefined;
        }
        return (await readFile(path)).toString();
    }

    private async checkForDataDir()
    {

        if(!this.checkedDir){
            if(!await pathExistsAsync(this.dataDir)){
                await mkdir(this.dataDir,{recursive:true});
            }
            this.checkedDir=true;
        }
    }

    protected async putValue(key: string, value: string): Promise<void> {
        await this.checkForDataDir();
        const path=this.keyToPath(key);
        await writeFile(path,value);
    }
    protected async deleteValue(key: string): Promise<boolean> {
        const path=this.keyToPath(key);
        if(!await pathExistsAsync(path)){
            return false;
        }
        await unlink(path);
        return true;
    }

    private watchingDataDir=false;

    public override watch<TK extends T = T>(key: string): ValuePointer<TK> | undefined {
        this.watchDataDirAsync();
        return super.watch(key);
    }

    private async watchDataDirAsync(){

        if(this.watchingDataDir || this.isDisposed){
            return;
        }

        this.watchingDataDir=true;

        await this.checkForDataDir();
        if(this.isDisposed){
            return;
        }



        const debounceMap:HashMap<number>={};

        while(!this.isDisposed){

            const abort=new AbortController();
            const listener=()=>abort.abort();
            this.disposeCancel.onCancelOrNextTick(listener);

            try{
                const watcher=watch(this.dataDir,{recursive:true,signal:abort.signal});
                for await (const update of watcher)
                {
                    if(this.isDisposed){
                        break;
                    }
                    if(!update.filename){
                        continue;
                    }
                    let key=decodeURIComponent(
                        update.filename.startsWith('/')?update.filename.substring(1):update.filename);
                    key=key.substring(this.keyPrefix.length);


                    if(debounceMap[key]===undefined){
                        debounceMap[key]=0;
                    }

                    const updateId=++debounceMap[key];

                    setTimeout(async ()=>{
                        if(!this.pointers[key] || this.isDisposed || debounceMap[key]!==updateId){
                            return;
                        }
                        try{
                            const json=await this.getValue(key);
                            const ptr=this.pointers[key];
                            if(!ptr || this.isDisposed || debounceMap[key]!==updateId){
                                return;
                            }
                            ptr._valueSource.next(json?JSON.parse(json):undefined);

                        }catch(ex){
                            console.error('FsStore watch callback failed',ex);
                        }
                    },this.watchDebounceDelayMs);
                }
            }catch(ex){
                if(!this.isDisposed){
                    console.warn('FsStore watch error',ex);
                    await delayAsync(5000);
                }
            }finally{
                this.disposeCancel.removeListener(listener);
            }

        }
    }

}
