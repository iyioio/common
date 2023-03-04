import { DeleteItemCommand, DynamoDBClient, DynamoDBClientConfig, GetItemCommand, PutItemCommand, QueryCommand, QueryCommandInput, ScanCommand, ScanCommandInput, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { AwsAuthProviders, awsRegionParam } from '@iyio/aws';
import { IWithStoreAdapter, Scope } from "@iyio/common";
import { createItemUpdateInputOrNull } from "./dynamo-lib";
import { DynamoStoreAdapter, DynamoStoreAdapterOptions } from "./DynamoStoreAdapter";

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
            TableName:tableName,
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
            TableName:tableName,
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
            TableName:tableName,
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


    public async getQueryAsync<T>(tableName:string,commandInput:Partial<QueryCommandInput>={}):Promise<PageResult<T>>
    {

        const params:QueryCommandInput={
            TableName:tableName,
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
            TableName:tableName,
            Key:marshall(key),
        }));

        return r.Item?unmarshall(r.Item) as T:undefined;
    }

    public async deleteAsync<T>(tableName:string,key:Partial<T>):Promise<void>
    {
        await this.getClient().send(new DeleteItemCommand({
            TableName:tableName,
            Key:marshall(key),
        }));
    }

    public async putAsync<T>(tableName:string, checkKey:(keyof T)|null, item:T):Promise<void>
    {
        await this.getClient().send(new PutItemCommand({
            TableName:tableName,
            Item:marshall(item),
            ExpressionAttributeNames:checkKey?{
                '#key':(checkKey as string)
            }:undefined,
            ConditionExpression:checkKey?"attribute_not_exists(#key)":undefined,
        }));
    }

    public async patchAsync<T>(tableName:string, key:Partial<T>, item:Partial<T>):Promise<void>
    {
        const update=createItemUpdateInputOrNull(tableName,key,item);
        if(!update){
            return;
        }

        await this.getClient().send(new UpdateItemCommand(update));
    }



}
