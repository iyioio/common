import { deepClone } from "./object";
import { isQueryGroupCondition, Query, QueryConditionOrGroup, QueryGroupConditionOp } from "./query-types";

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
