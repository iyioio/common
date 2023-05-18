import { ConditionalCheckFailedException, DeleteItemCommand, DynamoDBClient, DynamoDBClientConfig, GetItemCommand, GetItemCommandInput, PutItemCommand, QueryCommand, QueryCommandInput, ScanCommand, ScanCommandInput, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { convertToAttr, unmarshall } from '@aws-sdk/util-dynamodb';
import { AwsAuthProviders, awsRegionParam } from '@iyio/aws';
import { AuthDependentClient, DataTableDescription, DataTableIndex, IWithStoreAdapter, Scope, ValueCache, authService, deleteUndefined, getDataTableId } from "@iyio/common";
import { DynamoStoreAdapter, DynamoStoreAdapterOptions } from "./DynamoStoreAdapter";
import { ExtendedItemUpdateOptions, ItemPatch, convertObjectToDynamoAttributes, createItemUpdateInputOrNull, formatDynamoTableName } from "./dynamo-lib";

export interface PageResult<T>
{
    items:T[];
    lastKey?:any;
}

export interface QueryMatchTableOptions<T>
{
    table:DataTableDescription;
    index?:DataTableIndex;
    matchKey:Partial<T>;
    filter?:Partial<T>;
    commandInput?:Partial<QueryCommandInput>;
    pageKey?:any;
    projectionProps?:(keyof T)[];
    limit?:number;
    returnAll?:boolean;
    reverseOrder?:boolean;
}

export interface DynamoGetOptions<T>
{
    input?:GetItemCommandInput;

    /**
     * If defined only the props in the array will be returned.
     */
    includeProps?:(keyof T)[];
}

export interface PatchTableItemOptions<T> extends Omit<ExtendedItemUpdateOptions<T>,'matchCondition'>
{
    skipVersionCheck?:boolean;
}

export class DynamoClient extends AuthDependentClient<DynamoDBClient> implements IWithStoreAdapter
{

    public static fromScope(scope:Scope,storeAdapterOptions?:DynamoStoreAdapterOptions)
    {
        return new DynamoClient({
            region:awsRegionParam(scope),
            credentials:scope.get(AwsAuthProviders)?.getAuthProvider()
        },authService(scope).userDataCache,storeAdapterOptions)
    }


    public readonly clientConfig:Readonly<DynamoDBClientConfig>;

    public constructor(clientConfig:DynamoDBClientConfig,userDataCache:ValueCache<any>,storeAdapterOptions:DynamoStoreAdapterOptions={}){
        super(userDataCache);
        this.clientConfig=clientConfig;
        this.storeAdapterOptions=storeAdapterOptions
    }

    protected override createAuthenticatedClient():DynamoDBClient{
        return new DynamoDBClient(this.clientConfig);
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

    public async queryMatchTableAsync<T>({
        table,
        index,
        matchKey,
        filter,
        commandInput={},
        pageKey,
        projectionProps,
        limit,
        returnAll,
        reverseOrder,
    }:QueryMatchTableOptions<T>):Promise<PageResult<T>>{

        const input:Partial<QueryCommandInput>={
            IndexName:index?.name,
            ExpressionAttributeNames:{},
            ExpressionAttributeValues:{},
            ExclusiveStartKey:pageKey,
            ProjectionExpression:projectionProps?.map((p,i)=>`#_projected${i}`).join(','),
            Limit:limit,
            ScanIndexForward:!reverseOrder,
        };

        if(projectionProps){
            for(let i=0;i<projectionProps.length;i++){
                (input.ExpressionAttributeNames as any)[`#_projected${i}`]=projectionProps[i]
            }
        }

        if(matchKey){
            const keys=Object.keys(matchKey);
            input.KeyConditionExpression=keys.map(k=>`#_key${k} = :_key${k}`).join(',');
            for(let i=0;i<keys.length;i++){
                const key=keys[i] as keyof T;
                (input.ExpressionAttributeNames as any)[`#_key${keys[i]}`]=key;
                (input.ExpressionAttributeValues as any)[`:_key${keys[i]}`]=convertToAttr(matchKey[key]);
            }
        }

        if(filter){
            const keys=Object.keys(filter);
            input.FilterExpression=keys.map(k=>`#_filter${k} = :_filter${k}`).join(',');
            for(let i=0;i<keys.length;i++){
                const key=keys[i] as keyof T;
                (input.ExpressionAttributeNames as any)[`#_filter${keys[i]}`]=key;
                (input.ExpressionAttributeValues as any)[`:_filter${keys[i]}`]=convertToAttr(filter[key]);
            }
        }

        if(commandInput){
            for(const e in commandInput){
                (input as any)[e]=(commandInput as any)[e];
            }
        }

        if(returnAll){
            delete input.Limit;
        }

        let result=await this.queryTableAsync<T>(table,deleteUndefined(input));

        if(!returnAll || !result.lastKey){
            return result
        }

        const allItems=result.items;
        while(result.lastKey){
            input.ExclusiveStartKey=result.lastKey;
            result=await this.queryTableAsync<T>(table,deleteUndefined(input));
            for(let i=0;i<result.items.length;i++){
                allItems.push(result.items[i] as T);
            }
        }

        return {
            items:allItems
        }
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

    public async getAsync<T>(tableName:string,key:Partial<T>,options?:DynamoGetOptions<T>):Promise<T|undefined>
    {

        const projection=options?.includeProps?.join(', ');

        const r=await this.getClient().send(new GetItemCommand({
            TableName:formatDynamoTableName(tableName),
            Key:convertObjectToDynamoAttributes(key),
            ProjectionExpression:projection,
            ...(options?.input??{}),
        }));

        return r.Item?unmarshall(r.Item) as T:undefined;
    }

    public async getFromTableAsync<T>(table:DataTableDescription<T>,key:string|Partial<T>,options?:DynamoGetOptions<T>):Promise<T|undefined>
    {
        return this.getAsync<T>(
            getDataTableId(table),
            typeof key === 'string'?{[table.primaryKey]:key} as Partial<T>:key,
            options
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

    public async patchAsync<T>(tableName:string, key:Partial<T>, item:ItemPatch<T>, extendedOptions?:ExtendedItemUpdateOptions):Promise<void>
    {
        const update=createItemUpdateInputOrNull(tableName,key,item,true,extendedOptions);
        if(!update){
            return;
        }

        await this.getClient().send(new UpdateItemCommand(update));
    }

    public async patchTableItem<T>(
        table:DataTableDescription<T>,
        item:ItemPatch<T>,
        {
            skipVersionCheck,
            ...extendedOptions
        }:PatchTableItemOptions<T>={}
    ):Promise<boolean>{

        if((item as any)[table.primaryKey]===undefined){
            throw new Error(`primaryKey(${table.primaryKey}) required`);
        }

        if(table.sortKey && (item as any)[table.sortKey]===undefined){
            throw new Error(`sortKey(${table.sortKey}) required`);
        }

        const updateProp=skipVersionCheck?undefined:table.updateVersionProp;

        const uv=updateProp?(item as any)[updateProp]:undefined;
        if(!skipVersionCheck && updateProp && (typeof uv)!=='number'){
            throw new Error(`updateVersionProp(${updateProp}) required as number`);
        }

        const key:any={[table.primaryKey]:(item as any)[table.primaryKey]}
        if(table.sortKey){
            key[table.sortKey]=(item as any)[table.sortKey];
        }

        const tableName=getDataTableId(table);


        if(uv!==undefined && updateProp){
            (item as any)[updateProp]=uv+1;
        }

        let success=false;
        try{
            const update=createItemUpdateInputOrNull(tableName,key,item,true,{
                ...extendedOptions,
                matchCondition:updateProp && uv!==undefined?
                    {[updateProp]:uv}:undefined,
            });
            if(!update){
                return false;
            }

            await this.getClient().send(new UpdateItemCommand(update));

            success=true;

            return true;

        }catch(ex){
            if(ex instanceof ConditionalCheckFailedException){
                return false;
            }
            throw ex;
        }finally{
            if(!success && uv!==undefined && updateProp){
                (item as any)[updateProp]=uv;
            }
        }
    }



}

