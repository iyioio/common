

export interface StaticQueryOperator<T=any>
{
    orderBy?:boolean;
    op:(data:T[],query:QueryWithData<T>)=>void;
}


/**
 * An SQL select query represented in object form.
 */
export interface Query
{
    /**
     * The columns or values to select. If not defined all columns are selected using the * operator
     */
    columns?:NamedQueryValue[];

    /**
     * Name of table to select or a query to use for projection
     */
    table?:string|Query;

    /**
     * A name to define the table as in the query. If not defined a unique name will be generated.
     */
    tableAs?:string;

    /**
     * Tables or projections to join to the query
     */
    join?:QueryJoin|QueryJoin[];

    /**
     * A where condition or a group of where conditions
     */
    condition?:QueryConditionOrGroup;

    /**
     * Columns to order by results by
     */
    orderBy?:OrderCol|OrderCol[];

    /**
     * Limits the number of results returned
     */
    limit?:number;

    /**
     * Skips the specified number of rows returned
     */
    offset?:number;


    /**
     * If true the user should not be allowed to order the query
     */
    disableUserOrderBy?:boolean;

    isUserReadonly?:boolean;
}
export const isQuery=(value:any):value is Query=>{
    const tableType=typeof (value as Partial<Query>)?.table;
    return (tableType==='string' || tableType==='object' || Array.isArray((value as Partial<Query>)?.columns)) && !Array.isArray((value as Partial<Query>)?.table);
}

export interface SubQuery
{
    /**
     * This condition is used to limit the selected item to the scope of the parent query. In most
     * cases the condition will match the primary key of the parent query to a foreign key of the
     * sub-query. This condition will be added the sub-query using a "AND" group condition.
     */
    condition?:QueryConditionOrGroup;

    /**
     * The query to execute
     */
    query:Query;
}

export interface QueryJoin
{
    /**
     * Name of table to join
     */
    table:string;

    /**
     * A name to define the table as in the query. If not defined a unique name will be generated.
     */
    tableAs?:string;

    /**
     * This condition used to join the table
     */
    condition:QueryConditionOrGroup;
}


/**
 * Represents a query to be ran on a static set of data
 */
export interface QueryWithData<T=any> extends Omit<Query,'table'>
{
    table:T[];
}
export const isQueryWithData=<T=any>(value:any): value is QueryWithData<T>=>{
    return Array.isArray((value as Partial<QueryWithData<T>>)?.table);
}

export type QueryOrQueryWithData<T=any>=Query|QueryWithData<T>;

export const allQueryGroupConditionOps=['and','or'] as const;
export type QueryGroupConditionOp=typeof allQueryGroupConditionOps[number];

/**
 * Groups conditions with an AND or an OR operator
 */
export interface QueryGroupCondition
{
    /**
     * The operation used to combined the conditions
     */
    op:QueryGroupConditionOp;

    /**
     * The condition to combined
     */
    conditions:QueryConditionOrGroup[];

}
export const isQueryGroupCondition=(value:any):value is QueryGroupCondition=>{
    if(!value){
        return false;
    }
    const v=value as Partial<QueryGroupCondition>;
    return (allQueryGroupConditionOps.includes(v.op as any) && v.conditions)?true:false
}


export const allQueryConditionOps=['=','!=','>','<','>=','<=','like','not','in'] as const;
export type QueryConditionOp=typeof allQueryConditionOps[number];
export interface QueryCondition
{
    /**
     * The left side of the condition
     */
    left:QueryValue;

    /**
     * The operator used for comparison
     */
    op:QueryConditionOp;

    /**
     * The right side of the condition
     */
    right:QueryValue;

}
export const isQueryCondition=(value:any):value is QueryCondition=>{
    if(!value){
        return false;
    }
    const v=value as Partial<QueryCondition>;
    return (allQueryConditionOps.includes(v.op as any) && v.left && v.right)?true:false
}

export type QueryConditionOrGroup=QueryCondition|QueryGroupCondition;

export type QueryFunction='count';

/**
 * Represents any of the possible value types that can be used. Only one property of the QueryValue
 * should be defined at a time. Defining more that one property at a time can result in undefined
 * behaviour.
 */
export interface QueryValue
{
    /**
     * A sub-query to use as the value
     */
    subQuery?:SubQuery;

    /**
     * A column to use a the value
     */
    col?:QueryCol;

    /**
     * A literal value to use as the value
     */
    value?:string|number|boolean|null;

    /**
     * A predefined function to use as a value
     */
    func?:QueryFunction;
}

export interface NamedQueryValue extends QueryValue
{
    /**
     * the (as) part of a column select - select tableB.price as {name}
     */
    name:string;
}

/**
 * Represents a table in a table stack as a query is being built. As sub-queries are constructed
 * the sub-queries are pushed onto the stack and popped off once built. Numeric values represent
 * an index within the stack and can be a negative value. Negative values are calculated by
 * subtracting the target numeric value from the size of the stack, so -1 is the top table on
 * the stack.
 * - none = no target table, the table will be determined by context during sql execution.
 * - current = the top most table in the stack. Represents index -1
 * - parent = the table above the current table. Represents index -2
 */
export type QueryTargetTable=number|'none'|'current'|'parent';

/**
 * Represents a column to select or use in an operation
 */
export interface QueryCol
{
    /**
     * The name of the column
     */
    name:string;

    /**
     * The table the column belongs to
     */
    table?:string;

    /**
     * The target table the column belongs to.
     * @see QueryTargetTable
     */
    target?:QueryTargetTable;
}

export interface OrderCol extends QueryCol
{
    desc?:boolean;
}



/**
 * A query object stored in a database
 */
export interface BaseQueryRecord
{
    id:string;
    query:Query;
}
export const isBaseQueryRecord=(value:any):value is BaseQueryRecord=>{
    if(!value){
        return false;
    }
    const v:Partial<BaseQueryRecord>=value;
    return (typeof v.id === 'string') && isQuery(v.query);
}


export type QueryOptions<T=any>=string|BaseQueryRecord|Query|QueryWithData<T>;
