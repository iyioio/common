import { GetItemCommandInput, QueryCommandInput, ScanCommandInput, UpdateItemCommandInput, UpdateItemCommandOutput } from "@aws-sdk/client-dynamodb";
import { DataTableDescription, DataTableIndex } from "@iyio/common";

export interface PageResult<T>
{
    items:T[];
    lastKey?:any;
}

export interface ScanMatchTableOptions<T>
{
    table:DataTableDescription<T>;
    index?:DataTableIndex;
    filter?:FilterEntity<T>;
    commandInput?:Partial<ScanCommandInput>;
    pageKey?:any;
    projectionProps?:(keyof T)[];
    returnAll?:boolean;

    /**
     * If true items received from the database are not returned. This can be used to same
     * memory when using forEach and forEachPage if you don't need to further process the items.
     */
    discardItems?:boolean;

    /**
     * A function that is called for each page of items that is received from the database.
     * forEachPage can be used to process all items in a large table in small batches. Set limit to
     * control  how many items are passed to forEachPage at a time. returnAll discardItems
     * default to true and limit defaults to 100 when forEachPage is defined. If forEachPage returns
     * an array the array is awaited on using Promise.all. This allows forEachPage to map received
     * items to array of promises with minimum syntax.
     */
    forEachPage?:(items:T[],lastKey:any)=>void|boolean|Promise<void|boolean>|((Promise<any>|any)[]);


    /**
     * Limits the number of items returned. This differs from DynamoDb's default limit behavior which
     * limits the number of items scanned or queried which can result if fewer number of items
     * returned than the specified by limit.
     */
    limit?:number;

    /**
     * The number of additional items that should be scanned or quired to fill results.
     * @default 100
     */
    stepLimitStart?:number;

    /**
     * The max number of items that should be scanned or quired at a time when filling results
     * when using limit
     * @default stepLimitStart * 20
     */
    stepLimitMax?:number;

    /**
     * Each time limit is not reached the limit will multiplied by stepLimitMultiplier until
     * is reached stepLimitMax.
     * @default 2
     */
    stepLimitMultiplier?:number;
}

export interface QueryMatchTableOptions<T> extends Omit<ScanMatchTableOptions<T>,'commandInput'>
{
    matchKey:Partial<T>;
    reverseOrder?:boolean;
    commandInput?:Partial<QueryCommandInput>;
}

export interface DynamoGetOptions<T>
{
    input?:GetItemCommandInput;

    /**
     * If defined only the props in the array will be returned.
     */
    includeProps?:(keyof T)[];
}

export interface PatchTableItemOptions<T> extends ExtendedItemUpdateOptions<T>
{
    skipVersionCheck?:boolean;
    /**
     * If true the update version of the patched item will not be automatically incremented by one
     * when the update property is not present.
     */
    noAutoUpdateVersion?:boolean;

    /**
     * Controls the values that are returned from an update. Defaults to NONE or UPDATED_NEW if
     * handleReturnedValues or handleOutput is defined.
     */
    returnValues?:'NONE'|'ALL_OLD'|'UPDATED_OLD'|'ALL_NEW'|'UPDATED_NEW'

    /**
     * Called with the returned values of the update command
     */
    handleReturnedValues?:(values?:Partial<T>)=>void;

    /**
     * Called with raw results of the update command
     */
    handleOutput?:(commandOutput:UpdateItemCommandOutput)=>void;

    /**
     * Can be used to transform the UpdateItemCommandInput before being sent to the database
     */
    transformInput?:(input:UpdateItemCommandInput)=>UpdateItemCommandInput;
}

/*
 * S — String
 * SS — String Set
 * N — Number
 * NS — Number Set
 * B — Binary
 * BS — Binary Set
 * BOOL — Boolean
 * NULL — Null
 * L — List
 * M — Map
 */
export type DynamoValueType=
    'S'|// — String
    'SS'|// — String Set
    'N'|// — Number
    'NS'|// — Number Set
    'B'|// — Binary
    'BS'|// — Binary Set
    'BOOL'|// — Boolean
    'NULL'|// — Null
    'L'|// — List
    'M';// — Map

const FilterExpressionFlag=Symbol('FilterExpressionFlag');

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface BaseFilterExpression<T>
{

    /**
     * Checks if the property is contain in the provided array
     */
    isIn?:any[];

    /**
     * If true the property is checked to see if it exists and if false it is checked to see if
     * it does not exist
     */
    exists?:boolean;

    /**
     * Checks if the property is of the specified type
     * S — String
     * SS — String Set
     * N — Number
     * NS — Number Set
     * B — Binary
     * BS — Binary Set
     * BOOL — Boolean
     * NULL — Null
     * L — List
     * M — Map
     */
    type?:DynamoValueType;

    /**
     * Checks if the property start with the specified substring
     */
    startsWith?:string;

    /**
     * Checks if the property contains the provided value.
     */
    contains?:any;

    /**
     * Checks if the provided value contains the property.
     */
    valueContainsProperty?:any;

    /**
     * Checks if the property is equal to the provided value.
     */
    eq?:any;

    /**
     * Checks if the property does not equal the provided value.
     */
    neq?:any;

    /**
     * Checks if the property us less than the provided value.
     */
    lt?:any;

    /**
     * Checks if the property us less than equal to the provided value.
     */
    lte?:any;

    /**
     * Checks if the property us more than the provided value.
     */
    mt?:any;

    /**
     * Checks if the property us more than equal to the provided value.
     */
    mte?:any;

    /**
     * Used in combination with the eq, neq, lt, lte, mt and mte operators to check the sized
     * of the property value
     */
    size?:boolean;
}

export const createFilterExpression=<T=any>(update:BaseFilterExpression<T>):FilterExpression<T>=>({
    typeFlag:FilterExpressionFlag,
    ...update
})
export const isFilterExpression=<T=any>(value:any):value is FilterExpression<T>=>(
    value?(value as Partial<FilterExpression<T>>).typeFlag===FilterExpressionFlag:false
)
export interface FilterExpression<T> extends BaseFilterExpression<T>
{
    typeFlag:typeof FilterExpressionFlag;
}


const UpdateExpressionFlag=Symbol('UpdateExpressionFlag');

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface BaseUpdateExpression<T>
{
    /**
     * If defined add will be added to the current value of the target object.
     */
    add?:any;

    /**
     * If defined the values will be appended to the current value of the target object
     */
    listPush?:any[];

    /**
     * If defined the values will be prepended to the current value of the target object
     */
    listUnshift?:any[];

    /**
     * If true the property will be removed from the target object.
     */
    removeProperty?:boolean;
}
export type FilterEntity<TEntity>=
{
    [prop in keyof TEntity]?:TEntity[prop]|FilterExpression<TEntity[prop]>;
}

export const createUpdateExpression=<T=any>(update:BaseUpdateExpression<T>):UpdateExpression<T>=>({
    typeFlag:UpdateExpressionFlag,
    ...update
})
export const isUpdateExpression=<T=any>(value:any):value is UpdateExpression<T>=>(
    value?(value as Partial<UpdateExpression<T>>).typeFlag===UpdateExpressionFlag:false
)
export interface UpdateExpression<T> extends BaseUpdateExpression<T>
{
    typeFlag:typeof UpdateExpressionFlag;
}

export type ItemPatch<TEntity>=
{
    [prop in keyof TEntity]?:TEntity[prop]|UpdateExpression<TEntity[prop]>;
}

export interface ExtendedItemUpdateOptions<T=any>
{
    incrementProp?:keyof T;
    incrementValue?:number;
    matchCondition?:Partial<T>
}
