import { CancelToken, delayAsync, HashMap, SharedValuePointer, ValuePointer } from "@iyio/common";
import { BaseStore } from "./BaseStore";
import { KeyValueStoreKeyScope, KeyValueStoreOp } from "./key-value-store-types";

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

    public async getAsync(key:string,cancel?:CancelToken):Promise<T|undefined>
    {
        await this._delayAsync(cancel);
        return this.data[key];
    }

    public async putAsync(key:string,value:T,cancel?:CancelToken):Promise<T>
    {
        if(this.cloneValues){
            value={...value};
        }
        await this._delayAsync(cancel);
        this.pointers[key]?._valueSource.next(value);
        return this.data[key]=value;
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

    public watch(key:string):ValuePointer<T>|undefined
    {
        let ptr:SharedValuePointer<T>|undefined=this.pointers[key];
        if(!ptr){
            ptr=new SharedValuePointer<T>(this.data[key],()=>{
                delete this.pointers[key];
            });
            this.pointers[key]=ptr;
        }
        ptr.usage++;
        return ptr;

    }

}
