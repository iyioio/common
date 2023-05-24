import { ConditionalCheckFailedException, DeleteItemCommand, DynamoDBClient, DynamoDBClientConfig, GetItemCommand, PutItemCommand, QueryCommand, QueryCommandInput, ScanCommand, ScanCommandInput, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { AwsAuthProviders, awsRegionParam } from '@iyio/aws';
import { AuthDependentClient, DataTableDescription, IWithStoreAdapter, Scope, ValueCache, authService, getDataTableId } from "@iyio/common";
import { DynamoStoreAdapter, DynamoStoreAdapterOptions } from "./DynamoStoreAdapter";
import { convertObjectToDynamoAttributes, createItemUpdateInputOrNull, formatDynamoTableName, getQueryCommandInput, getScanCommandInput } from "./dynamo-lib";
import { DynamoGetOptions, ExtendedItemUpdateOptions, ItemPatch, PageResult, PatchTableItemOptions, QueryMatchTableOptions, ScanMatchTableOptions, isUpdateExpression } from "./dynamo-types";


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

    public logCommandInput=false;

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

        if(this.logCommandInput){
            console.info('getScanAsync',params);
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


    public async firstQueryMatchTableAsync<T>(options:QueryMatchTableOptions<T>):Promise<T|undefined>{

        const result=await this.queryMatchTableAsync({...options,limit:1});
        return result.items[0];
    }


    public queryMatchTableAsync<T>(options:QueryMatchTableOptions<T>):Promise<PageResult<T>>{

        const input=getQueryCommandInput(options);

        return this.processQueryAsync(input,options,(table,input)=>this.queryTableAsync<T>(table,input));
    }

    public scanMatchTableAsync<T>(options:ScanMatchTableOptions<T>):Promise<PageResult<T>>{

        const input=getScanCommandInput(options);

        return this.processQueryAsync(input,options,(table,input)=>this.scanTableAsync<T>(table,input));
    }

    private async  processQueryAsync<
        T,
        TOptions extends ScanMatchTableOptions<T>,
        TInput extends Partial<ScanCommandInput>
    >(
        input:TInput,
        options:TOptions,
        queryAsync:(table:DataTableDescription<T>,input:TInput)=>Promise<PageResult<T>>
    ):Promise<PageResult<T>>{
        const {
            table,
            forEachPage,
            returnAll=forEachPage?true:undefined,
            discardItems=forEachPage?true:undefined,
        }=options;

        let result=await queryAsync(table,input);

        if(forEachPage && result.items.length){
            const _forEach=await forEachPage(result.items,result.lastKey);
            if(Array.isArray(_forEach)){
                await Promise.all(_forEach);
            }else if(_forEach){
                if(discardItems){
                    result.items=[];
                }
                return result;
            }
        }


        if(!returnAll || !result.lastKey || !result.items.length){
            if(discardItems){
                result.items=[];
            }
            return result
        }

        const allItems=discardItems?[]:result.items;
        let _continue=true;
        while(result.lastKey && _continue){
            input.ExclusiveStartKey=result.lastKey;
            result=await queryAsync(table,input);
            if(forEachPage && result.items.length){
                const _forEach=await forEachPage(result.items,result.lastKey);
                if(Array.isArray(_forEach)){
                    await Promise.all(_forEach);
                }else if(_forEach){
                    _continue=false;
                }
            }
            if(!discardItems){
                for(let i=0;i<result.items.length;i++){
                    allItems.push(result.items[i] as T);
                }
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

    public scanTableAsync<T>(table:DataTableDescription<T>,commandInput:Partial<QueryCommandInput>):Promise<PageResult<T>>
    {
        return this.getScanAsync(getDataTableId(table),commandInput);
    }


    public async getQueryAsync<T>(tableName:string,commandInput:Partial<QueryCommandInput>={}):Promise<PageResult<T>>
    {

        const params:QueryCommandInput={
            TableName:formatDynamoTableName(tableName),
            ...commandInput
        }

        if(this.logCommandInput){
            console.info('getQueryAsync',params);
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

    /**
     * Patches the given item. Use the createUpdateExpression function to patch the item using
     * dynamic expressions. Update expressions can be used to increment values based on the
     * value in the database.
     */
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
        const uvIsUpdateExpression=isUpdateExpression(uv);
        if(!skipVersionCheck && !uvIsUpdateExpression && updateProp && (typeof uv)!=='number'){
            throw new Error(`updateVersionProp(${updateProp}) required as number`);
        }

        const key:any={[table.primaryKey]:(item as any)[table.primaryKey]}
        if(table.sortKey){
            key[table.sortKey]=(item as any)[table.sortKey];
        }

        const tableName=getDataTableId(table);


        if(!uvIsUpdateExpression && uv!==undefined && updateProp){
            (item as any)[updateProp]=uv+1;
        }

        let success=false;
        try{
            const update=createItemUpdateInputOrNull(tableName,key,item,true,{
                ...extendedOptions,
                matchCondition:!uvIsUpdateExpression && updateProp && uv!==undefined?
                    {[updateProp]:uv}:undefined,
            });
            if(!update){
                return false;
            }

            if(this.logCommandInput){
                console.info('patchTableItem',update);
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
            if(!success && !uvIsUpdateExpression && uv!==undefined && updateProp){
                (item as any)[updateProp]=uv;
            }
        }
    }



}

