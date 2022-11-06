import { ExecuteStatementCommand, Field, RDSDataClient } from "@aws-sdk/client-rds-data";
import { awsRegionParam, IAwsAuth, IAwsAuthType } from "@iyio/aws";
import { defineStringParam, Scope, SqlBaseClient, SqlResult, SqlRow, TypeDef } from '@iyio/common';
import { IKeyValueStore, KeyValueStoreKeyScope } from "@iyio/key-value-store";

export const rdsClusterArnParam=defineStringParam('rdsClusterArn');
export const rdsSecretArnParam=defineStringParam('rdsSecretArn');
export const rdsDatabaseParam=defineStringParam('rdsDatabase');

export interface RdsStoreOptions
{
    awsAuth:TypeDef<IAwsAuth>;
    clusterArn:string;
    secretArn:string;
    database:string;
    region:string;
}

export class RdsStore<T=any> extends SqlBaseClient implements IKeyValueStore<T>
{

    public static optionsFromScope(scope:Scope):RdsStoreOptions{
        return {
            awsAuth:scope.to(IAwsAuthType),
            clusterArn:scope.require(rdsClusterArnParam),
            secretArn:scope.require(rdsSecretArnParam),
            database:scope.require(rdsDatabaseParam),
            region:scope.require(awsRegionParam),
        }
    }

    public static fromScope(scope:Scope){
        return new RdsStore(RdsStore.optionsFromScope(scope));
    }

    private readonly options:RdsStoreOptions;

    public keyBase?:string;

    public keyReg?:RegExp;

    public keyRegIndex?:number;

    public keyCondition?:(key:string)=>string|boolean;

    public constructor(options:RdsStoreOptions,keyFilter?:KeyValueStoreKeyScope)
    {
        super();
        this.options={...options}
        if(keyFilter){
            this.keyBase=keyFilter.keyBase;
            this.keyReg=keyFilter.keyReg;
            this.keyRegIndex=keyFilter.keyRegIndex;
            this.keyCondition=keyFilter.keyCondition;
        }
    }

    private client:RDSDataClient|null=null;
    private getClient():RDSDataClient{
        if(this.client){
            return this.client;
        }
        this.client=new RDSDataClient({
            region:this.options.region,
            credentials:this.options.awsAuth.get()?.getAuthProvider()
        })
        return this.client;
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

    // public async getAsync(key:string,cancel?:CancelToken):Promise<T|undefined>
    // {
    //     //
    // }

    // public async putAsync(key:string,value:T,cancel?:CancelToken):Promise<T>
    // {
    //     //
    // }

    // public async patchAsync(key:string,value:Partial<T>,cancel?:CancelToken):Promise<T>
    // {
    //     //
    // }

    // public async createAsync(baseKey:string,primaryKey:(keyof T)|null|undefined,value:Partial<T>,cancel?:CancelToken):Promise<CreateKeyValueResult<T>>
    // {
    //     //
    // }

    // public async createNoReturnAsync(baseKey:string,primaryKey:(keyof T)|null|undefined,value:Partial<T>,cancel?:CancelToken):Promise<void>
    // {
    //     //
    // }

    // public async deleteAsync(key:string,cancel?:CancelToken):Promise<boolean|undefined>
    // {
    //     //
    // }

    // public async queryAsync(baseKey:string,query:Query,cancel?:CancelToken):Promise<T[]>
    // {
    //     //

    // }
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
        return field.arrayValue;
    }else{
        return null;
    }
}
