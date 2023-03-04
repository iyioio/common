import { BaseStore, convertStorePathToSqlPathInfo, CreateStoreValueResult, InvalidStoreKeyError, joinPaths, SqlPathInfo, StoreKeyScope } from "@iyio/common";
import { DynamoClient } from "./DynamoClient";



export interface DynamoStoreAdapterOptions extends StoreKeyScope
{
    /**
     * If defined store operations will be limited to the specified table.
     */
    tableName?:string;

    /**
     * The name of the partition key for the specified table.
     * @default 'id'
     */
    partitionKey?:string;

    /**
     * The name of the sort key for the specified table.
     * @default 'id'
     */
    sortKey?:string;

    /**
     * Array of secondary indexes of the table
     */
    secondaryIndexes?:string[];
}

export class DynamoStoreAdapter<T=any> extends BaseStore<T>
{

    private readonly client:DynamoClient;

    private readonly options:DynamoStoreAdapterOptions;

    public constructor(client:DynamoClient,options:DynamoStoreAdapterOptions)
    {
        super(options);
        this.client=client;
        this.options={...options};
    }

    public async getAsync<TK extends T=T>(key:string):Promise<TK|undefined>
    {
        const pathInfo=convertStorePathToSqlPathInfo(key,this.options.tableName,this.options.partitionKey);
        if(!pathInfo?.keyName || !pathInfo.keyValue){
            throw new InvalidStoreKeyError(`key = ${key}`);
        }

        const result=await this.client
            .getAsync(pathInfo.table,{[pathInfo.keyName]:pathInfo.keyValue}) as TK|undefined;

        return result

    }

    private requirePathInfoForInsert(key:string,value:any):SqlPathInfo{

        if(!value){
            throw new Error('value required for getting path info');
        }

        const pathInfo=convertStorePathToSqlPathInfo(key,this.options.tableName,this.options.partitionKey);
        if(!pathInfo || pathInfo.keyName===undefined || pathInfo.keyValue===undefined){
            throw new InvalidStoreKeyError(`key = ${key}`);
        }

        if( value[pathInfo.keyName]===undefined ||
            value[pathInfo.keyName].toString()!==pathInfo.keyValue
        ){
            throw new InvalidStoreKeyError("key value does not match key path");
        }

        return pathInfo;
    }

    public async putAsync<TK extends T=T>(key:string,value:TK):Promise<void>
    {
        const pathInfo=this.requirePathInfoForInsert(key,value);

        await this.client.putAsync<TK>(pathInfo.table,pathInfo.keyName as keyof TK,value);
    }

    public async patchAsync<TK extends T=T>(key:string,value:Partial<TK>):Promise<void>
    {
        const pathInfo=convertStorePathToSqlPathInfo(key,this.options.tableName,this.options.partitionKey);
        if(!pathInfo?.keyName || !pathInfo.keyValue){
            throw new InvalidStoreKeyError(`key = ${key}`);
        }

        const keyValue=(value as any)[pathInfo.keyName];

        if(keyValue===undefined || keyValue.toString()!==pathInfo.keyValue){
            throw new InvalidStoreKeyError('key path does not match key value');
        }

        await this.client.patchAsync(
            pathInfo.table,{[pathInfo.keyName]:keyValue} as any,value);
    }

    public async createAsync<TK extends T=T>(baseKey:string,primaryKey:(keyof TK)|null|undefined,value:Partial<TK>):Promise<CreateStoreValueResult<TK>>
    {
        const keyValue=(value as any)[primaryKey];

        if(keyValue===undefined){
            throw new InvalidStoreKeyError('value must have a primaryKey value');
        }


        const key=joinPaths(baseKey,keyValue);

        await this.putAsync(key,value as any);

        const r=await this.getAsync<TK>(key);

        if(!r){
            throw new Error('Value not created');
        }

        return {
            value:r,
            key:(r as any)[primaryKey??'id']
        }
    }

    public async createNoReturnAsync<TK extends T=T>(baseKey:string,primaryKey:(keyof TK)|null|undefined,value:Partial<TK>):Promise<void>
    {
        const keyValue=(value as any)[primaryKey];

        if(keyValue===undefined){
            throw new InvalidStoreKeyError('value must have a primaryKey value');
        }

        const key=joinPaths(baseKey,keyValue);

        await this.putAsync(key,value as any);
    }

    public async deleteAsync(key:string):Promise<undefined>
    {
        const pathInfo=convertStorePathToSqlPathInfo(key,this.options.tableName,this.options.partitionKey);
        if(!pathInfo?.keyName || !pathInfo.keyValue){
            throw new InvalidStoreKeyError(`key = ${key}`);
        }

        await this.client.deleteAsync(pathInfo.table,{[pathInfo.keyName]:pathInfo.keyValue})

        return undefined;
    }


     /**
     * Returns a collection of values based on the given query.
     */
    // public async queryAsync<TK extends T=T>(baseKey:string,query:Query,cancel?:CancelToken):Promise<TK[]>
    // {
    //     const pathInfo=convertStorePathToSqlPathInfo(baseKey,this.options.tableName,this.options.partitionKey);
    //     if(!pathInfo?.table){
    //         throw new InvalidStoreKeyError(`baseKey = ${baseKey}`);
    //     }
    // }

    // /**
    //  * Watches a value with the given key. The returned pointer will update its value subject
    //  * as the value changes.
    //  */
    // watch?<TK extends T=T>(key:string):ValuePointer<TK>|undefined;

    // /**
    //  * Watches a collection of items based on the given query. Changes to the collection can be
    //  * listened to by using the pointers changeCount.
    //  */
    // watchQuery?<TK extends T=T>(baseKey:string,query:Query):ListPointer<TK>|undefined;
}
