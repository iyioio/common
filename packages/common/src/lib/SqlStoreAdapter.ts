import { BaseStore } from "./BaseStore";
import { InvalidStoreKeyError } from "./errors";
import { CreateKeyValueResult, KeyValueStoreKeyScope } from "./key-value-store-types";
import { Query } from "./query-types";
import { sql, sqlName } from "./sql-lib";
import { buildQuery, convertStorePathToSelectQuery, convertStorePathToSqlInsert, SqlInsertInfo } from "./sql-query-builder";
import { ISqlClient } from "./sql-types";


export interface SqlStoreAdapterOptions extends KeyValueStoreKeyScope
{
    /**
     * If defined store operations will be limited to the specified table.
     */
    tableName?:string;
}

export class SqlStoreAdapter<T=any> extends BaseStore<T>
{

    private readonly client:ISqlClient;

    private readonly options:SqlStoreAdapterOptions;

    public constructor(client:ISqlClient,options:SqlStoreAdapterOptions)
    {
        super(options);
        this.client=client;
        this.options={...options};
    }

    public async getAsync<TK extends T=T>(key:string):Promise<TK|undefined>
    {
        const query=convertStorePathToSelectQuery(key,this.options.tableName);
        if(!query){
            throw new InvalidStoreKeyError(`key = ${key}`);
        }
        query.limit=1;

        const result=await this.client.execAsync(buildQuery(query),true);

        return result.rows?.[0] as TK|undefined;

    }

    private requirePathInfoForInsert(key:string,value:any):SqlInsertInfo{

        if(!value){
            throw new Error('value required for getting path info');
        }

        const pathInfo=convertStorePathToSqlInsert(key,this.options.tableName);
        if(!pathInfo){
            throw new InvalidStoreKeyError(`key = ${key}`);
        }

        if( pathInfo.keyValue!==undefined &&
            pathInfo.keyName!==undefined &&
            value[pathInfo.keyName]!==undefined &&
            value[pathInfo.keyName].toString()!==pathInfo.keyValue
        ){
            throw new InvalidStoreKeyError("key value does not match key path");
        }

        return pathInfo;
    }

    public async putAsync<TK extends T=T>(key:string,value:TK):Promise<void>
    {
        const pathInfo=this.requirePathInfoForInsert(key,value);

        await this.client.insertAsync<TK>(pathInfo.table,value);
    }

    public async patchAsync<TK extends T=T>(key:string,value:Partial<TK>):Promise<void>
    {
        const pathInfo=convertStorePathToSqlInsert(key,this.options.tableName);
        if(!pathInfo?.keyName || !pathInfo.keyValue){
            throw new InvalidStoreKeyError(`key = ${key}`);
        }

        const keyValue=(value as any)[pathInfo.keyName];

        if(keyValue!==undefined && keyValue.toString()!==pathInfo.keyValue){
            throw new InvalidStoreKeyError('key path does not match key value');
        }

        await this.client.updateAsync(pathInfo.table,value,pathInfo.keyName as any);
    }

    public async createAsync<TK extends T=T>(baseKey:string,primaryKey:(keyof TK)|null|undefined,value:Partial<TK>):Promise<CreateKeyValueResult<TK>>
    {
        const pathInfo=this.requirePathInfoForInsert(baseKey,value);

        const r=await this.client.insertReturnAsync<TK>(pathInfo.table,value as any);

        return {
            value:r,
            key:(r as any)[primaryKey??'id']
        }
    }

    public async createNoReturnAsync<TK extends T=T>(baseKey:string,primaryKey:(keyof TK)|null|undefined,value:Partial<TK>):Promise<void>
    {
        await this.putAsync(baseKey,value as any);
    }

    public async deleteAsync(key:string):Promise<boolean|undefined>
    {
        const pathInfo=convertStorePathToSqlInsert(key,this.options.tableName);
        if(!pathInfo?.keyName || !pathInfo.keyValue){
            throw new InvalidStoreKeyError(`key = ${key}`);
        }
        const r=await this.client.execAsync(sql`
            DELETE FROM ${sqlName(pathInfo.table)}
            WHERE ${sqlName(pathInfo.keyName)} = ${pathInfo.keyValue}
        `)

        return r.updates>0;
    }

    public async queryAsync<TK extends T=T>(baseKey:string,query:Query):Promise<TK[]>
    {
        const pathInfo=convertStorePathToSqlInsert(baseKey,this.options.tableName);
        if(!pathInfo?.keyName || !pathInfo.keyValue){
            throw new InvalidStoreKeyError(`key = ${baseKey}`);
        }

        return this.client.selectAsync(buildQuery(query));
    }
}
