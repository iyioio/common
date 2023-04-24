import { DeleteItemCommand, DynamoDBClient, DynamoDBClientConfig, GetItemCommand, PutItemCommand, QueryCommand, QueryCommandInput, ScanCommand, ScanCommandInput, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { AwsAuthProviders, awsRegionParam } from '@iyio/aws';
import { DataTableDescription, IWithStoreAdapter, Scope, getDataTableId } from "@iyio/common";
import { DynamoStoreAdapter, DynamoStoreAdapterOptions } from "./DynamoStoreAdapter";
import { ExtendedItemUpdateOptions, convertObjectToDynamoAttributes, createItemUpdateInputOrNull, formatDynamoTableName } from "./dynamo-lib";

interface PageResult<T>
{
    items:T[];
    lastKey?:any;
}

export class DynamoClient implements IWithStoreAdapter
{

    public static fromScope(scope:Scope,storeAdapterOptions?:DynamoStoreAdapterOptions)
    {
        return new DynamoClient({
            region:awsRegionParam(scope),
            credentials:scope.get(AwsAuthProviders)?.getAuthProvider()
        },storeAdapterOptions)
    }


    public readonly clientConfig:Readonly<DynamoDBClientConfig>;

    public constructor(clientConfig:DynamoDBClientConfig,storeAdapterOptions:DynamoStoreAdapterOptions={}){

        this.clientConfig=clientConfig;
        this.storeAdapterOptions=storeAdapterOptions
    }

    private client:DynamoDBClient|null=null;
    public getClient():DynamoDBClient{
        if(this.client){
            return this.client;
        }
        this.client=new DynamoDBClient(this.clientConfig);
        return this.client;
    }


    private readonly storeAdapterOptions:DynamoStoreAdapterOptions;
    private storeAdapter:DynamoStoreAdapter|null=null;
    public getStoreAdapter():DynamoStoreAdapter
    {
        if(this.storeAdapter){
            return this.storeAdapter;
        }
        this.storeAdapter=new DynamoStoreAdapter(this,this.storeAdapterOptions);
        return this.storeAdapter;
    }


    public async getAllScanAsync<T>(tableName:string,commandInput:Partial<ScanCommandInput>={}):Promise<T[]>
    {

        const params:ScanCommandInput={
            TableName:formatDynamoTableName(tableName),
            ...commandInput
        }

        const results:T[]=[];
        do{
            const items=await this.getClient().send(new ScanCommand(params));
            if(items.Items){
                for(const item of items.Items){
                    results.push(unmarshall(item) as T);
                }
            }
            params.ExclusiveStartKey=items.LastEvaluatedKey;
        }while(typeof params.ExclusiveStartKey !== "undefined");

        return results;
    }


    public async getScanAsync<T>(tableName:string,commandInput:Partial<ScanCommandInput>={}):Promise<PageResult<T>>
    {

        const params:ScanCommandInput={
            TableName:formatDynamoTableName(tableName),
            ...commandInput
        }

        const results:T[]=[];
        const items=await this.getClient().send(new ScanCommand(params));
        if(items.Items){
            for(const item of items.Items){
                results.push(unmarshall(item) as T);
            }
        }

        return {
            items:results,
            lastKey:items.LastEvaluatedKey,
        }
    }


    public async getAllQueryAsync<T>(tableName:string,commandInput:Partial<QueryCommandInput>={}):Promise<T[]>
    {

        const params:QueryCommandInput={
            TableName:formatDynamoTableName(tableName),
            ...commandInput
        }

        const results:T[]=[];
        do{
            const items=await this.getClient().send(new QueryCommand(params));
            if(items.Items){
                for(const item of items.Items){
                    results.push(unmarshall(item) as T);
                }
            }
            params.ExclusiveStartKey=items.LastEvaluatedKey;
        }while(typeof params.ExclusiveStartKey !== "undefined");

        return results;
    }

    public queryTableAsync<T>(table:DataTableDescription<T>,commandInput:Partial<QueryCommandInput>):Promise<PageResult<T>>
    {
        return this.getQueryAsync(getDataTableId(table),commandInput);
    }


    public async getQueryAsync<T>(tableName:string,commandInput:Partial<QueryCommandInput>={}):Promise<PageResult<T>>
    {

        const params:QueryCommandInput={
            TableName:formatDynamoTableName(tableName),
            ...commandInput
        }

        const results:T[]=[];
        const items=await this.getClient().send(new QueryCommand(params));
        if(items.Items){
            for(const item of items.Items){
                results.push(unmarshall(item) as T);
            }
        }

        return {
            items:results,
            lastKey:items.LastEvaluatedKey,
        };
    }

    public async getAsync<T>(tableName:string,key:Partial<T>):Promise<T|undefined>
    {
        const r=await this.getClient().send(new GetItemCommand({
            TableName:formatDynamoTableName(tableName),
            Key:convertObjectToDynamoAttributes(key),
        }));

        return r.Item?unmarshall(r.Item) as T:undefined;
    }

    public async getFromTableAsync<T>(table:DataTableDescription<T>,key:string|Partial<T>):Promise<T|undefined>
    {
        return this.getAsync<T>(
            getDataTableId(table),
            typeof key === 'string'?{[table.primaryKey]:key} as Partial<T>:key
        );
    }

    public async deleteAsync<T>(tableName:string,key:Partial<T>):Promise<void>
    {
        await this.getClient().send(new DeleteItemCommand({
            TableName:formatDynamoTableName(tableName),
            Key:convertObjectToDynamoAttributes(key),
        }));
    }

    public deleteFromTableAsync<T>(table:DataTableDescription<T>,key:Partial<T>|string):Promise<void>{
        return this.deleteAsync(getDataTableId(table),typeof(key)==='string'?{[table.primaryKey]:key} as Partial<T>:key);
    }

    public async putAsync<T extends Record<string,any>>(tableName:string, checkKey:(keyof T)|null, item:T):Promise<void>
    {
        await this.getClient().send(new PutItemCommand({
            TableName:formatDynamoTableName(tableName),
            Item:convertObjectToDynamoAttributes(item),
            ExpressionAttributeNames:checkKey?{
                '#key':(checkKey as string)
            }:undefined,
            ConditionExpression:checkKey?"attribute_not_exists(#key)":undefined,
        }));
    }

    public putIntoTable<T extends Record<string,any>>(table:DataTableDescription<T>,item:T):Promise<void>
    {
        return this.putAsync(getDataTableId(table),table.primaryKey,item);
    }

    public async patchAsync<T>(tableName:string, key:Partial<T>, item:Partial<T>, extendedOptions?:ExtendedItemUpdateOptions):Promise<void>
    {
        const update=createItemUpdateInputOrNull(tableName,key,item,true,extendedOptions);
        if(!update){
            return;
        }

        await this.getClient().send(new UpdateItemCommand(update));
    }



}

