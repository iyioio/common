import { BaseStore } from "./BaseStore";
import { CancelToken } from "./CancelToken";
import { delayAsync } from "./common-lib";
import { HashMap } from "./common-types";
import { KeyValueStoreKeyScope, KeyValueStoreOp } from "./key-value-store-types";
import { ValuePointer } from "./pointers";
import { SharedValuePointer } from "./shared-pointers";

export interface MemoryStoreOptions extends KeyValueStoreKeyScope
{
    /**
     * Number of milliseconds to delay memory store operations. Default is 0.
     */
    delayMs?:number;

    /**
     * If true value added to the store will be cloned before stored.
     */
    cloneValues?:boolean;
}

/**
 * Stores value in memory
 */
export class MemoryStore<T=any> extends BaseStore<T>
{

    public delay:number;

    public cloneValues:boolean;

    private readonly data:HashMap={};

    public constructor(options?:MemoryStoreOptions)
    {
        super(options);
        this.delay=options?.delayMs??0;
        this.cloneValues=options?.cloneValues??false;
    }


    supports(key: string, op: KeyValueStoreOp): boolean {
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
        return this.data[key];
    }

    public async putAsync<TK extends T=T>(key:string,value:TK,cancel?:CancelToken):Promise<void>
    {
        if(this.cloneValues){
            value={...value};
        }
        await this._delayAsync(cancel);
        this.pointers[key]?._valueSource.next(value);
        this.data[key]=value;
    }

    public async deleteAsync(key:string,cancel?:CancelToken):Promise<boolean>
    {
        await this._delayAsync(cancel);
        if(this.data[key]===undefined){
            return false;
        }
        delete this.data[key];
        this.pointers[key]?._valueSource.next(undefined);
        return true;
    }

    public watch<TK extends T=T>(key:string):ValuePointer<TK>|undefined
    {
        let ptr:SharedValuePointer<T>|undefined=this.pointers[key];
        if(!ptr){
            ptr=new SharedValuePointer<T>(this.data[key],()=>{
                delete this.pointers[key];
            });
            this.pointers[key]=ptr;
        }
        ptr.usage++;
        return ptr as any as SharedValuePointer<TK>;

    }

}
