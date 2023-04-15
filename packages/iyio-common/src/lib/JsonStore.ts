import { BaseStore } from "./BaseStore";
import { CancelToken } from "./CancelToken";
import { delayAsync, isPromise } from "./common-lib";
import { HashMap, IDisposable } from "./common-types";
import { ValuePointer } from "./pointers";
import { SharedValuePointer } from "./shared-pointers";
import { StoreKeyScope, StoreOp } from "./store-types";

export interface JsonStoreOptions extends StoreKeyScope
{
    /**
     * Number of milliseconds to delay store operations. Default is 0.
     */
    delayMs?:number;

    jsonFormatting?:number;
}

/**
 * Stores values as JSON strings and relies on a sub-classes to implement actual storage.
 */
export abstract class JsonStore<T=any> extends BaseStore<T> implements IDisposable
{

    public delay:number;

    private readonly jsonFormatting:number;

    public constructor(options?:JsonStoreOptions)
    {
        super(options);
        this.delay=options?.delayMs??0;
        this.jsonFormatting=options?.jsonFormatting??0;
    }

    private _isDisposed=false;
    public get isDisposed(){return this._isDisposed}
    public dispose()
    {
        if(this._isDisposed){
            return;
        }
        this._isDisposed=true;
    }


    public supports(key: string, op: StoreOp): boolean {
        switch(op){
            case 'get':
            case 'put':
            case 'delete':
            case 'watch':
                return true;

            default:
                return false;
        }
    }

    private async _delayAsync(cancel?:CancelToken)
    {
        if(this.delay>0){
            await delayAsync(this.delay);
            cancel?.throwIfCanceled();
        }
    }

    public async getAsync<TK extends T=T>(key:string,cancel?:CancelToken):Promise<TK|undefined>
    {
        await this._delayAsync(cancel);
        const json=await this.getValue(key,cancel);
        return json===undefined?undefined:JSON.parse(json);
    }

    public async putAsync<TK extends T=T>(key:string,value:TK,cancel?:CancelToken):Promise<void>
    {
        await this._delayAsync(cancel);
        this.pointers[key]?._valueSource.next(value);
        await this.putValue(key,JSON.stringify(value,null,this.jsonFormatting));
    }

    public async deleteAsync(key:string,cancel?:CancelToken):Promise<boolean|undefined>
    {
        await this._delayAsync(cancel);
        const deleted=await this.deleteValue(key,cancel);
        if(deleted===false){
            return false;
        }
        this.pointers[key]?._valueSource.next(undefined);
        return deleted;
    }

    public watch<TK extends T=T>(key:string):ValuePointer<TK>|undefined
    {
        let ptr:SharedValuePointer<T>|undefined=this.pointers[key];
        if(!ptr){
            const json=this.getValue(key);
            let value:T|undefined;
            const isP=isPromise<string|undefined>(json);
            if(json && !isP){
                value=JSON.parse(json);
            }
            ptr=new SharedValuePointer<T>(value,()=>{
                delete this.pointers[key];
            });
            if(isP){
                json.then(v=>{
                    if(v!==undefined && ptr && ptr.value===undefined && !this._isDisposed){
                        ptr._valueSource.next(JSON.parse(v))
                    }
                })
            }
            this.pointers[key]=ptr;
        }
        ptr.usage++;
        return ptr as any as SharedValuePointer<TK>;

    }

    protected abstract getValue(key:string,cancel?:CancelToken):Promise<string|undefined>|string|undefined;

    protected abstract putValue(key:string,value:string,cancel?:CancelToken):Promise<void>|void;

    protected abstract deleteValue(key:string,cancel?:CancelToken):Promise<boolean|undefined>|boolean|undefined;

}


export class JsonMemoryStore extends JsonStore
{

    private readonly data:HashMap<string>={};

    protected getValue(key: string): string | undefined {
        return this.data[key];
    }
    protected putValue(key: string, value: string): void {
        this.data[key]=value;
    }
    protected deleteValue(key: string): boolean {
        if(this.data[key]===undefined){
            return false;
        }
        delete this.data[key];
        return true;
    }

}
