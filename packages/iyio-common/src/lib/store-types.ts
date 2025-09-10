import { CancelToken } from "./CancelToken.js";
import { IOpDisposable } from "./common-types.js";
import { ListPointer, ValuePointer } from "./pointers.js";
import { Query } from "./query-types.js";
import { TypeDef } from "./scope-types.js";


export type StoreOp='get'|'put'|'patch'|'create'|'delete'|'query'|'watch'|'watchQuery';

export interface StoreMatch
{
    /**
     * The matched store
     */
    store:IStore;

    /**
     * The scoped key after matching the store
     */
    scopedKey:string;
}


export interface StoreKeyScope
{

    keyBase?:string;

    keyReg?:RegExp;

    keyRegIndex?:number;

    keyCondition?:(key:string)=>string|boolean;
}

export interface StoreScope extends StoreKeyScope
{

    supports?(key:string,op:StoreOp):boolean;
}

export interface StoreProvider<T=any> extends StoreScope
{
    providerType:TypeDef<IStore<T>|IWithStoreAdapter<T>>;
}

export interface CreateStoreValueResult<T=any>
{
    key:string;
    value:T;
}

export interface StoreOpMethods<T=any>
{
    /**
     * Returns a value by key
     */
    getAsync?<TK extends T=T>(key:string,cancel?:CancelToken):Promise<TK|undefined>;

    /**
     * Updates or creates a value with the given key
     */
    putAsync?<TK extends T=T>(key:string,value:TK,cancel?:CancelToken):Promise<void>;

    /**
     * Updates an existing value
     */
    patchAsync?<TK extends T=T>(key:string,value:Partial<TK>,cancel?:CancelToken):Promise<void>;

    /**
     * Creates a new value and returns the newly create value and its key.
     * @param baseKey The key of the value minus its primary key value
     * @param primaryKey The primary key property of the value
     * @param value The value to be created
     */
    createAsync?<TK extends T=T>(baseKey:string,primaryKey:(keyof TK)|null|undefined,value:Partial<TK>,cancel?:CancelToken):Promise<CreateStoreValueResult<TK>>;

    /**
     * Creates a new value but does not return the created value. This function can be used as an
     * optimization when you don't need the created value. If not defined createAsync will be used
     * as a fallback.
     * @param baseKey The key of the value minus its primary key value
     * @param primaryKey The primary key property of the value
     * @param value The value to be created
     */
    createNoReturnAsync?<TK extends T=T>(baseKey:string,primaryKey:(keyof TK)|null|undefined,value:Partial<TK>,cancel?:CancelToken):Promise<void>;


    /**
     * Deletes a value by key. If the provider can not determine if the value was deleted
     * undefined will be returned.
     */
    deleteAsync?(key:string,cancel?:CancelToken):Promise<boolean|undefined>;

    /**
     * Returns a collection of values based on the given query.
     */
    queryAsync?<TK extends T=T>(baseKey:string,query:Query,cancel?:CancelToken):Promise<TK[]>;

    /**
     * Watches a value with the given key. The returned pointer will update its value subject
     * as the value changes.
     */
    watch?<TK extends T=T>(key:string):ValuePointer<TK>|undefined;

    /**
     * Watches a collection of items based on the given query. Changes to the collection can be
     * listened to by using the pointers changeCount.
     */
    watchQuery?<TK extends T=T>(baseKey:string,query:Query):ListPointer<TK>|undefined;

}

export interface IStore<T=any> extends StoreOpMethods<T>, StoreScope, IOpDisposable
{
    getWatchCount?():number;
}

export const isIWithStoreAdapter=(value:any):value is IWithStoreAdapter=>(
    typeof (value as Partial<IWithStoreAdapter>)?.getStoreAdapter === 'function'
)

export interface IWithStoreAdapter<T=any>
{
    getStoreAdapter():IStore<T>;
}


export type StoreBinaryValueType=Uint8Array;

export class BinaryStoreValue
{
    public readonly content:StoreBinaryValueType;
    public readonly contentType:string;
    public readonly length?:number;

    public constructor(contentType:string,content:StoreBinaryValueType,length?:number)
    {
        this.contentType=contentType;
        this.content=content;
        this.length=length;
    }
}
