import { asType } from "./common-lib";
import { isQueryCondition, isQueryGroupCondition, NamedQueryValue, Query, QueryCol, QueryConditionOrGroup, QueryGroupCondition, QueryValue } from "./query-types";
import { escapeSqlName, escapeSqlValue } from "./sql-lib";

/**
 * Builds a SQL query string from the specified Query object.
 * @param query The query object to use
 * @param subCondition An optional condition to add to the query's condition. If the query already
 *                     has a condition the 2 conditions will be combined together with the AND operator.
 * @param maxDepth The max sub-query depth.
 * @returns A SQL query string
 */
export const buildQuery=(query:Query,subCondition?:QueryConditionOrGroup,maxDepth?:number):string=>{
    const ctx:QueryBuildCtx={
        sql:[],
        idStack:[],
        maxDepth:maxDepth??100,
        nextAs:1,
    }
    _buildQuery(ctx,0,query,subCondition??null);
    return ctx.sql.join(' ');
}

interface QueryBuildCtx
{
    maxDepth:number;
    nextAs:number;
    sql:string[];
    idStack:string[];
}

const _buildQuery=(ctx:QueryBuildCtx, depth:number, query:Query, subCondition:QueryConditionOrGroup|null):void=>{

    if(depth>ctx.maxDepth){
        throw new Error(`Max query depth reached. maxDepth=${ctx.maxDepth}`);
    }

    const asName=query.tableAs??'_tbl_'+(ctx.nextAs++);
    ctx.idStack.push(asName);

    ctx.sql.push('select');
    if(query.columns){

        for(const v of query.columns){

            appendValue(ctx,false,v,depth);
            ctx.sql.push(',');
        }

        ctx.sql.pop();

    }else{
        ctx.sql.push('*');
    }


    if(typeof query.table === 'string'){
        ctx.sql.push(`from ${escapeSqlName(query.table)} as ${escapeSqlName(asName)}`);
    }else{
        ctx.sql.push('from');
        ctx.sql.push('(');
        _buildQuery(ctx,depth+1,query.table,null);
        ctx.sql.push(')');
        ctx.sql.push(`as ${escapeSqlName(asName)}`);
    }



    const cond=(
        ((query.condition && subCondition)?
            asType<QueryGroupCondition>({op:'and',conditions:[subCondition,query.condition]})
        :
            query.condition??subCondition
        )
    )
    if(cond){
        ctx.sql.push('where');

        appendCondition(ctx,cond,depth+1);
    }



    if(query.orderBy){
        ctx.sql.push('order by')
        const ary=Array.isArray(query.orderBy)?query.orderBy:[query.orderBy];
        for(const orderBy of ary){
            appendCol(ctx,orderBy);
            ctx.sql.push(orderBy.desc?'desc':'asc');
            ctx.sql.push(',')
        }
        ctx.sql.pop();
    }


    if(query.offset!==undefined){
        ctx.sql.push('offset '+escapeSqlValue(query.offset))
    }


    if(query.limit!==undefined){
        ctx.sql.push('limit '+escapeSqlValue(query.limit))
    }

    ctx.idStack.pop();

}

const appendCondition=(ctx:QueryBuildCtx,cond:QueryConditionOrGroup,depth:number)=>{
    if(depth>ctx.maxDepth){
        throw new Error(`Max query depth reached. maxDepth=${ctx.maxDepth}`);
    }
    ctx.sql.push('(');
    if(isQueryGroupCondition(cond)){
        for(const c of cond.conditions){
            appendCondition(ctx,c,depth+1);
            ctx.sql.push(cond.op);
        }
        ctx.sql.pop();
    }else if(isQueryCondition(cond)){
        appendValue(ctx,true,cond.left,depth);
        ctx.sql.push(cond.op);
        appendValue(ctx,true,cond.right,depth);
    }
    ctx.sql.push(')');
}

const appendValue=(ctx:QueryBuildCtx,enclose:boolean,value:QueryValue|NamedQueryValue,depth:number)=>{

    if(enclose){
        ctx.sql.push('(');
    }

    let isNull=false;

    if(value.col){
        appendCol(ctx,value.col);
    }else if(value.value!==undefined){
        ctx.sql.push(escapeSqlValue(value.value));
    }else if(value.subQuery){
        ctx.sql.push('(');
        _buildQuery(ctx,depth+1,value.subQuery.query,value.subQuery.condition??null);
        ctx.sql.push(')');
    }else if(value.func){
        switch(value.func){
            case 'count':
                ctx.sql.push('count(*)');
                break;

            default:
                ctx.sql.push('null');
                break;
        }
    }else{
        isNull=true;
        ctx.sql.push('null');
    }

    const asName=(value as NamedQueryValue).name;
    if(asName){
        if(isNull){
            ctx.sql.pop();
            appendCol(ctx,{name:asName});
        }else{
            ctx.sql.push('as '+escapeSqlName(asName));
        }
    }

    if(enclose){
        ctx.sql.push(')');
    }
}

const appendCol=(ctx:QueryBuildCtx,col:QueryCol)=>{
    if(col.table){
        ctx.sql.push(escapeSqlName(col.table)+'.'+escapeSqlName(col.name));
    }else if(col.name==='*'){
        ctx.sql.push('*');
    }else if(col.target!==undefined && col.target!=='none'){
        const target=typeof col.target === 'number'?col.target:col.target==='parent'?-2:-1;
        const t=ctx.idStack[target<0?ctx.idStack.length+target:target];
        if(!t){
            throw new Error('query builder idStack out of range')
        }
        ctx.sql.push(escapeSqlName(t)+'.'+escapeSqlName(col.name));
    }else{
        ctx.sql.push(escapeSqlName(col.name));
    }
}


/**
 * Converts a key value store path to a select query
 * path format -         /{tableName}/{keyName}/{keyValue}
 * example path -        /messages/id/aab76047-5c68-4b82-b53f-06f384f0d145
 * translated query -    select * from "message" where "id" = 'aab76047-5c68-4b82-b53f-06f384f0d145'
 */
export const convertStorePathToSelectQuery=(path:string,scopedTable?:string):Query|undefined=>
{
    if(path.startsWith('/')){
        path=path.substring(1);
    }
    if(scopedTable){
        path=scopedTable+'/'+path;
    }
    const [table,keyName,keyValue]=path.split('/',3);

    if(!table || !keyName || keyValue===undefined){
        return undefined;
    }

    return {
        table,
        condition:{
            left:{col:{name:keyName}},
            op:'=',
            right:{value:keyValue}
        }
    }
}

export interface SqlInsertInfo
{
    table:string;
    keyName?:string;
    keyValue?:string;
}
export const convertStorePathToSqlInsert=(path:string,scopedTable?:string):SqlInsertInfo|undefined=>{
    if(path.startsWith('/')){
        path=path.substring(1);
    }
    if(scopedTable){
        path=scopedTable+'/'+path;
    }
    const [table,keyName,keyValue]=path.split('/',3);

    if(!table){
        return undefined;
    }

    return {table,keyName,keyValue}
}
