import { GetItemCommandInput, QueryCommandInput, ScanCommandInput } from "@aws-sdk/client-dynamodb";
import { DataTableDescription, DataTableIndex } from "@iyio/common";

export interface PageResult<T>
{
    items:T[];
    lastKey?:any;
}

export interface ScanMatchTableOptions<T>
{
    table:DataTableDescription;
    index?:DataTableIndex;
    filter?:FilterEntity<T>;
    commandInput?:Partial<ScanCommandInput>;
    pageKey?:any;
    projectionProps?:(keyof T)[];
    limit?:number;
    returnAll?:boolean;
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

export interface PatchTableItemOptions<T> extends Omit<ExtendedItemUpdateOptions<T>,'matchCondition'>
{
    skipVersionCheck?:boolean;
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
     * If not undefined add will be added to the current value of the target object.
     */
    add?:any;
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
