import { wSetProp } from "./obj-watch-lib.js";
import { deepClone } from "./object.js";
import { isQueryCondition, isQueryGroupCondition, Query, QueryConditionOrGroup, QueryGroupConditionOp, QueryValue } from "./query-types.js";

/**
 * Applies any shorthand properties to the query. By default a new query object is created if any
 * shorthand properties are applied. If inPlace is set to true any shorthand properties changes
 * are applied in-place on the passed in query object.
 */
export const applyQueryShorthands=(query:Query,inPlace=false):Query=>{

    if(!inPlace && (query.match /* || query.OTHER_SHORT_HANDS_HERE*/)){
        query=deepClone(query);
    }


    if(query.match){

        const match=query.match;
        delete query.match;

        for(const e in match){
            addQueryCondition(query,{
                op:'=',
                left:{col:{name:e}},
                right:{value:match[e]}
            },'and')
        }

    }


    return query;
}

export const addQueryCondition=(query:Query,condition:QueryConditionOrGroup,mergeOp:QueryGroupConditionOp)=>{
    if(!query.condition){
        query.condition=condition;
        return;
    }

    if(isQueryGroupCondition(query.condition) && query.condition.op===mergeOp){
        query.condition.conditions.push(condition);
    }else if(isQueryGroupCondition(condition) && condition.op===mergeOp){
        condition.conditions.push(query.condition);
        query.condition=condition;
    }else{
        query.condition={
            conditions:[query.condition,condition],
            op:mergeOp
        }
    }
}

export const setQueryTableAsDefault=(query:Query|null|undefined)=>{
    _setQueryTableAsDefault(query,[]);
}

const _setQueryTableAsDefault=(query:Query|null|undefined,usedNames:string[])=>{

    if(!query){
        return;
    }

    if(query.tableAs){
        usedNames.push(query.tableAs);
    }

    switch(typeof query.table){
        case 'string':
            if(query.tableAs===undefined && !usedNames.includes(query.table)){
                usedNames.push(query.table);
                wSetProp(query,'tableAs',query.table);
            }
            break;

        case 'object':
            _setQueryTableAsDefault(query.table,usedNames);
            break;
    }

    if(query.columns){
        for(const c of query.columns){
            setQueryValueTableAsDefault(c,usedNames);
        }
    }
    if(query.condition){
        setQueryConditionTableAsDefault(query.condition,usedNames);
        if(isQueryGroupCondition(query.condition)){
            for(const c of query.condition.conditions){

            }
        }else if(isQueryCondition(query.condition)){

        }
    }

}

const setQueryConditionTableAsDefault=(cond:QueryConditionOrGroup|null|undefined,usedNames:string[])=>{
    if(!cond){
        return;
    }
    if(isQueryGroupCondition(cond)){
        for(const c of cond.conditions){
            setQueryConditionTableAsDefault(c,usedNames);
        }
    }else if(isQueryCondition(cond)){
        if(cond.left){
            setQueryValueTableAsDefault(cond.left,usedNames);
        }
        if(cond.right){
            setQueryValueTableAsDefault(cond.right,usedNames);
        }
    }

}
const setQueryValueTableAsDefault=(value:QueryValue|null|undefined,usedNames:string[])=>{
    if(!value){
        return;
    }
    if(value.subQuery){
        _setQueryTableAsDefault(value.subQuery.query,usedNames);
        if(value.subQuery.condition){
            setQueryConditionTableAsDefault(value.subQuery.condition,usedNames);
        }
    }
    if(value.args){
        for(const a of value.args){
            setQueryValueTableAsDefault(a,usedNames);
        }
    }
    if(value.expression){
        for(const e of value.expression){
            if(typeof e === 'string'){
                continue;
            }
            setQueryValueTableAsDefault(e,usedNames);
        }
    }
}
