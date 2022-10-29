import { IOpDisposable } from "./common-types";
import { ListPointer, ValuePointer } from "./pointers";
import { Query } from "./query-types";
import { TypeRef } from "./TypeRef";



export interface KeyValueStoreProviderMatch
{
    provider:IKeyValueStoreProvider;

    /**
     * The narrowed key after matching the provider
     */
    key:string;
}

export type KeyValueStoreOp='get'|'put'|'delete'|'query'|'watch'|'watchQuery';

export interface KeyValueStoreFilter
{
    keyBase?:string;

    keyReg?:RegExp;

    keyRegIndex?:number;

    keyCondition?:(key:string)=>string|boolean;

    supports?(key:string,op:KeyValueStoreOp):boolean;
}

export interface KeyStoreProviderRef<T=any> extends KeyValueStoreFilter
{
    providerType:TypeRef<IKeyValueStoreProvider<T>>;
}

export interface IKeyValueStoreProvider<T=any> extends KeyValueStoreFilter, IOpDisposable
{
    getAsync?(key:string):Promise<T|undefined>;
    putAsync?(key:string,item:Partial<T>):Promise<T>;
    deleteAsync?(key:string):Promise<boolean>;
    queryAsync?(key:string,query:Query):Promise<T[]>;
    watch?(key:string):ValuePointer<T>|undefined;
    watchQuery?(key:string,query:Query):ListPointer<T>|undefined;

}

