import { ExecuteStatementCommand, Field, RDSDataClient } from "@aws-sdk/client-rds-data";
import { AwsAuthProvider, AwsAuthProviders, awsRegionParam } from "@iyio/aws";
import { IWithStoreAdapter, Scope, SqlBaseClient, SqlResult, SqlRow, SqlStoreAdapter, SqlStoreAdapterOptions, TypeDef, ValueCache, authService, defineStringParam, delayAsync, minuteMs, safeParseNumberOrUndefined, splitSqlStatements, sql } from '@iyio/common';

export const rdsClusterArnParam=defineStringParam('rdsClusterArn');
export const rdsSecretArnParam=defineStringParam('rdsSecretArn');
export const rdsDatabaseParam=defineStringParam('rdsDatabase');
export const rdsVersionParam=defineStringParam('rdsVersion');

export interface RdsClientOptions
{
    awsAuth:TypeDef<AwsAuthProvider>;
    clusterArn:string;
    secretArn:string;
    database:string;
    region:string;
    autoSplitStatements?:boolean;
}


export class RdsClient<T=any> extends SqlBaseClient implements IWithStoreAdapter<T>
{

    public static optionsFromScope(scope:Scope):RdsClientOptions{
        return {
            awsAuth:scope.to(AwsAuthProviders),
            clusterArn:scope.require(rdsClusterArnParam),
            secretArn:scope.require(rdsSecretArnParam),
            database:scope.require(rdsDatabaseParam),
            region:scope.require(awsRegionParam),
        }
    }

    public static fromScope(scope:Scope,storeAdapterOptions?:SqlStoreAdapterOptions){
        return new RdsClient(
            RdsClient.optionsFromScope(scope),
            authService(scope).userDataCache,
            storeAdapterOptions,
            safeParseNumberOrUndefined(scope.to(rdsVersionParam).get())===2
        );
    }

    private readonly options:RdsClientOptions;

    private readonly storeAdapterOptions:SqlStoreAdapterOptions;

    private readonly authServerUserDataCache:ValueCache<any>;

    public autoSplitStatements:boolean;

    public constructor(
        options:RdsClientOptions,
        authServerUserDataCache:ValueCache<any>,
        storeAdapterOptions:SqlStoreAdapterOptions={},
        autoSplitStatements=false
    ){
        super();
        this.options={...options};
        this.storeAdapterOptions={...storeAdapterOptions};
        this.authServerUserDataCache=authServerUserDataCache;
        this.autoSplitStatements=autoSplitStatements;
    }

    protected readonly clientCacheKey=Symbol();
    public getClient():RDSDataClient{
        return this.authServerUserDataCache.getOrCreate(this.clientCacheKey,()=>new RDSDataClient({
            region:this.options.region,
            credentials:this.options.awsAuth.get()?.getAuthProvider()
        }))
    }

    private storeAdapter:SqlStoreAdapter|null=null;
    public getStoreAdapter():SqlStoreAdapter<T>
    {
        if(this.storeAdapter){
            return this.storeAdapter;
        }
        this.storeAdapter=new SqlStoreAdapter(this,this.storeAdapterOptions);
        return this.storeAdapter;
    }


    /**
     * Sends a ExecuteStatementCommand with the given sql. In most cases you will not directly use
     * this function.
     * @param sql The SQL to execute.
     * @param includeResultMetadata If true metadata about the query will be returned. Including
     *                              metadata about the columns returns which can be used to parse
     *                              the returned data.
     * @returns an ExecuteStatementCommandOutput object
     */
    public async sendAsync(sql:string,includeResultMetadata=false)
    {
        if(this.log){
            console.info(sql)
        }

        const t=Date.now();

        if(this.autoSplitStatements){
            const split=splitSqlStatements(sql);
            if(split.length>1){
                sql=split.pop()??'';
                for(const s of split){
                    await this.getClient().send(new ExecuteStatementCommand({
                        resourceArn:this.options.clusterArn,
                        secretArn:this.options.secretArn,
                        database:this.options.database,
                        sql:s
                    }));
                }
            }else{
                sql=split[0]??''
            }
        }
        const cmd=new ExecuteStatementCommand({
            resourceArn:this.options.clusterArn,
            secretArn:this.options.secretArn,
            database:this.options.database,
            includeResultMetadata,
            sql
        })

        const result=await this.getClient().send(cmd);

        if(this.log){
            console.info(`${Date.now()-t}ms`);
        }
        return result;
    }

    /**
     * Executes an sql statement and optionally returns selected items as formatted rows.
     * @param sql The sql to executed
     * @param includeResultMetadata If true and the first statement of the sql selects data
     *                              the selected data will be parsed and stored in the rows
     *                              property of the returned SqlResult
     * @param noLogResult If true logging is disable even if the client is configured to log results
     * @returns an SqlResult object
     */
    public async execAsync(sql:string,includeResultMetadata=false,noLogResult=false):Promise<SqlResult>
    {
        const r=await this.sendAsync(sql,includeResultMetadata);
        let rows:SqlRow[]|undefined;
        if(r.columnMetadata && r.records){
            rows=[];
            for(const record of r.records){
                const row:SqlRow={};
                rows.push(row);
                for(let i=0;i<r.columnMetadata.length;i++){
                    const col=r.columnMetadata[i];
                    if(!col.name){
                        continue;
                    }
                    row[col.name]=convertFieldValue(record[i],col.typeName);
                }
            }
        }
        const result:SqlResult={
            updates:r.numberOfRecordsUpdated??0,
            rows
        };

        if(this.log && !noLogResult){
            console.info(JSON.stringify(result,null,4));
        }

        return result;
    }

    /**
     * Wakes update the database by running a select query
     * @param timeoutMs If null wakeDatabaseAsync will wait indefinitely.
     * @param delayMs Number of milliseconds to wait between wait attempts. default = 5 minutes
     */
    public async wakeDatabaseAsync(timeoutMs:number|null=minuteMs*5,delayMs=100):Promise<void>{
        const start=Date.now();
        // eslint-disable-next-line no-constant-condition
        while(true){
            try{
                await this.execAsync(sql`select ${'wake-up'} as ${{name:'action'}}`,true);
                return;
            }catch{
                await delayAsync(delayMs);
            }
            if(timeoutMs!==null && (Date.now()-start)>timeoutMs){
                throw new Error('Wake database timeout');
            }
        }
    }


}

/**
 * Converts a Field object returned from AWS RDSDataClients to a raw value.
 * @param field
 * @param colMetadataTypeName
 * @returns
 */
export const convertFieldValue=(field:Field,colMetadataTypeName?:string):any=>{
    if(field.stringValue!==undefined){
        switch(colMetadataTypeName){

            case "json":
            case "jsonb":
            case "vector":
                return JSON.parse(field.stringValue);


            default:
                return field.stringValue;
        }
    }else if(field.longValue!==undefined){
        return field.longValue;
    }else if(field.booleanValue!==undefined){
        return field.booleanValue;
    }else if(field.doubleValue!==undefined){
        return field.doubleValue;
    }else if(field.arrayValue!==undefined){
        const av=field.arrayValue;
        return (
            av.stringValues??
            av.doubleValues??
            av.longValues??
            av.booleanValues
        )
    }else{
        return null;
    }
}
