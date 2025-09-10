import { httpClient } from "./http.deps.js";
import { HttpClient } from "./HttpClient.js";
import { defineStringParam } from "./scope-lib.js";
import { Scope } from "./scope-types.js";
import { ISqlTransaction, SqlExecCommand, SqlResult, SqlTransactionStatus } from "./sql-types.js";
import { SqlBaseClient } from "./SqlBaseClient.js";

export const sqlHttpClientUrlParam=defineStringParam('sqlHttpClientUrl');

export interface SqlHttpClientOptions
{
    url:string;
}


const execAsync=async (
    client:HttpClient,
    options:SqlHttpClientOptions,
    sql:string,
    includeResultMetadata?:boolean,
    noLogResult?:boolean,
    transactionId?:string
):Promise<SqlResult>=>
{
    const command:SqlExecCommand={
        sql,
        includeResultMetadata,
        noLogResult,
        transactionId
    }

    const result=await client.postAsync<SqlResult>(options.url,command);
    if(!result){
        throw new Error('No SqlHttpClient http response')
    }

    return result;
}

export class SqlHttpClient extends SqlBaseClient
{

    public static fromScope(scope:Scope,options?:SqlHttpClientOptions)
    {
        return new SqlHttpClient(
            httpClient(scope),
            options??{
                url:scope.require(sqlHttpClientUrlParam)
            }
        )
    }

    private readonly client:HttpClient;
    private readonly options:SqlHttpClientOptions;
    protected _transactionId?:string;

    public constructor(client:HttpClient,options:SqlHttpClientOptions)
    {
        super();
        this.client=client;
        this.options={...options}
    }

    public execAsync(sql:string,includeResultMetadata?:boolean,noLogResult?:boolean):Promise<SqlResult>
    {
        return execAsync(this.client,this.options,sql,includeResultMetadata,noLogResult,this._transactionId);
    }

    protected async _beginTransactionAsync():Promise<ISqlTransaction>
    {
        const r=await this.execAsync('BEGIN TRANSACTION');
        if(!r.transactionId){
            throw new Error('Failed to start transaction');
        }
        return new SqlHttpTransaction(
            this.client,
            this.options,
            r.transactionId,
            t=>this.closeTransaction(t)
        )
    }
}

class SqlHttpTransaction extends SqlHttpClient implements ISqlTransaction
{

    public get transactionId():string{return this._transactionId??''};



    private _transactionStatus:SqlTransactionStatus='waiting';
    public get transactionStatus(){return this._transactionStatus}

    public constructor(
        client:HttpClient,
        options:SqlHttpClientOptions,
        transactionId:string,
        onDispose?:(transaction:SqlHttpTransaction)=>void
    ){
        super(client,options);
        this._transactionId=transactionId;
        this.disposables.addCb(()=>{
            onDispose?.(this);
        })
    }

    public async commitAsync():Promise<void>
    {
        if(this.transactionStatus!=='waiting'){
            throw new Error(`Transaction already has a status of ${this.transactionStatus}`);
        }
        this._transactionStatus='committing';
        await this.execAsync('COMMIT TRANSACTION');
        this._transactionStatus='committed';
    }
    /**
     * Called automatically when when the transaction is disposed if not committed.
     */
    public async rollbackAsync():Promise<void>
    {
        if(this.transactionStatus!=='waiting'){
            throw new Error(`Transaction already has a status of ${this.transactionStatus}`);
        }
        this._transactionStatus='rollingBack';
        await this.execAsync('ROLLBACK TRANSACTION');
        this._transactionStatus='rolledBack';
    }
}
