import { asArray } from "./array";
import { asType } from "./common-lib";
import { applyQueryShorthands } from "./query-lib";
import { isQueryCondition, isQueryGroupCondition, NamedQueryValue, Query, QueryCol, queryConditionNotMap, queryConditionOpInfos, QueryConditionOrGroup, queryExpressionOperators, queryFunctions, QueryGroupCondition, QueryValue } from "./query-types";
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

    query=applyQueryShorthands(query,false);

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
    }else if(query.table){
        ctx.sql.push('from');
        ctx.sql.push('(');
        _buildQuery(ctx,depth+1,query.table,null);
        ctx.sql.push(')');
        ctx.sql.push(`as ${escapeSqlName(asName)}`);
    }


    if(query.join){
        const joins=asArray(query.join);
        for(const join of joins){
            const joinAsName=join.tableAs??'_tbl_'+(ctx.nextAs++);
            ctx.sql.push(join.required?'join':'left outer join');
            ctx.sql.push(escapeSqlName(join.table));
            ctx.sql.push('as');
            ctx.sql.push(escapeSqlName(joinAsName));
            ctx.sql.push('on');
            appendCondition(ctx,join.condition,depth+1);
        }
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

    if(query.groupBy){
        ctx.sql.push('group by');
        const cols=Array.isArray(query.groupBy)?query.groupBy:[query.groupBy];
        for(const col of cols){
            if(typeof col === 'object'){
                appendCol(ctx,col);
            }else{
                ctx.sql.push(escapeSqlName(col));
            }
            ctx.sql.push(',')
        }
        ctx.sql.pop();
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
        const info=queryConditionOpInfos.find(o=>o.op===cond.op && (o.not??false)===(cond.not??false));

        if(info?.leftPrefix){
            ctx.sql.push(info.leftPrefix);
        }
        appendValue(ctx,cond.left.value!==null,cond.left,depth);
        if(info?.leftSuffix){
            ctx.sql.push(info.leftSuffix);
        }

        if(cond.not){
            const notOp=queryConditionNotMap[cond.op];
            if(!notOp){
                throw new Error(`The (${cond.op}) does not support the not modifier`);
            }
            ctx.sql.push(info?.sqlOp??notOp);
        }else{
            ctx.sql.push(info?.sqlOp??cond.op);
        }

        if(info?.rightPrefix){
            ctx.sql.push(info.rightPrefix);
        }
        appendValue(ctx,cond.right.value!==null,cond.right,depth);
        if(info?.rightSuffix){
            ctx.sql.push(info.rightSuffix);
        }
    }
    ctx.sql.push(')');
}
const nonEncloseValues=[true,false];
const appendValue=(ctx:QueryBuildCtx,enclose:boolean,value:QueryValue|NamedQueryValue,depth:number,ignoreFunc=false,fallbackValue?:string)=>{

    if(depth>ctx.maxDepth){
        throw new Error(`Max query depth reached. maxDepth=${ctx.maxDepth}`);
    }
    const startI=ctx.sql.length;
    if(enclose){
        ctx.sql.push('(');
    }

    const coal=value.coalesce!==undefined && !ignoreFunc;
    if(coal){
        ctx.sql.push('coalesce(')
    }

    let isNull=false;

    if(value.func && !ignoreFunc){
        const funcs=asArray(value.func);
        for(const fn of funcs){
            if(!queryFunctions.includes(fn)){
                throw new Error(`Invalid query func - ${fn}`);
            }
            ctx.sql.push(`${fn}(`)
        }

        appendValue(ctx,false,value,depth+1,true,'*');

        for(let i=0;i<funcs.length;i++){
            ctx.sql.push(`)`)
        }
    }else if(value.col){
        appendCol(ctx,value.col);
    }else if(value.value!==undefined){
        if(nonEncloseValues.includes(value.value as any)){
            ctx.sql.splice(startI,1);
            enclose=false;
        }
        ctx.sql.push(escapeSqlValue(value.value,undefined,false));
    }else if(value.generatedValue){
        const g=value.generatedValue;
        switch(g.type){

            case 'timeMs':
                ctx.sql.push((Date.now()+(g.offset??0)).toString());
                break;

            case 'timeSec':
                ctx.sql.push(Math.round((Date.now()+(g.offset??0))/1000).toString());
                break;

            default:
                throw new Error(`Unsupported generated value type - ${(g as any).type}`);
        }
    }else if(value.subQuery){
        ctx.sql.push('(');
        _buildQuery(ctx,depth+1,value.subQuery.query,value.subQuery.condition??null);
        ctx.sql.push(')');
    }else if(value.expression){
        ctx.sql.push('(');
        for(const e of value.expression){
            if(typeof e === 'string'){
                if(!queryExpressionOperators.includes(e)){
                    throw new Error(`Invalid queryExpressionOperator - ${e}`);
                }
                ctx.sql.push(e);
            }else{
                appendValue(ctx,false,e,depth+1);
            }
        }
        ctx.sql.push(')');
    }else if(value.args){
        for(let i=0;i<value.args.length;i++){
            const arg=value.args[i];
            if(!arg){continue}
            if(i>0){
                ctx.sql.push(',');
            }
            appendValue(ctx,false,arg,depth+1);

        }
    }else if(fallbackValue){
        ctx.sql.push(fallbackValue);
    }else{
        isNull=true;
        ctx.sql.push('null');
    }

    if(coal){
        ctx.sql.push(',');
        ctx.sql.push(escapeSqlValue(value.coalesce));
        ctx.sql.push(')');
    }

    const asName=(value as NamedQueryValue).name;
    if(asName && !ignoreFunc){
        if(isNull){
            if(!enclose){
                ctx.sql.pop();
            }
            appendCol(ctx,{name:asName});
        }else{
            ctx.sql.push('as '+escapeSqlName(asName));
        }
    }

    if(enclose){
        ctx.sql.push(')');
    }
}

const appendCol=(ctx:QueryBuildCtx,col:QueryCol|string)=>{
    if(typeof col === 'string'){
        ctx.sql.push(escapeSqlName(col));
    }else if(col.table){
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
 * path format -                /{tableName}/(${keyName}/)?{keyValue}
 * path with default prop -     /messages/aab76047-5c68-4b82-b53f-06f384f0d145
 * query width default prop -   select * from "message" where "id" = 'aab76047-5c68-4b82-b53f-06f384f0d145'
 * path with name prop -        /messages/$name/bob
 * query width name prop -      select * from "message" where "name" = 'bob'
 */
export const convertStorePathToSelectQuery=(path:string,scopedTable?:string,defaultProp:string='id'):Query|undefined=>
{
    const info=convertStorePathToSqlPathInfo(path,scopedTable,defaultProp);

    if(!info?.keyName || !info.keyValue){
        return undefined
    }

    return {
        table:info.table,
        condition:{
            left:{col:{name:info.keyName}},
            op:'=',
            right:{value:info.keyValue}
        }
    }
}

export interface SqlPathInfo
{
    table:string;
    keyName?:string;
    keyValue?:string;
}
/**
 * Converts a key value store path to a SqlPathInfo object
 * path format - /{tableName}/(${keyName}/)?{keyValue}
 */
export const convertStorePathToSqlPathInfo=(path:string,scopedTable?:string,defaultProp:string='id'):SqlPathInfo|undefined=>{

    if(path.startsWith('/')){
        path=path.substring(1);
    }
    if(scopedTable){
        path=scopedTable.replace(/\//g,'')+'/'+path;
    }
    const [table,propOrValue,customKeyValue]=path.split('/');

    if(!table){
        return undefined;
    }

    if(!propOrValue){
        return {
            table
        }
    }

    let keyName:string;
    let keyValue:string|undefined;
    if(propOrValue.startsWith('$')){
        keyName=propOrValue.substring(1);
        keyValue=customKeyValue;
    }else{
        keyName=defaultProp;
        keyValue=propOrValue;
    }

    return {table,keyName,keyValue}
}
