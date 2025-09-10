import { deepCompare, getValueByPath } from "./object.js";
import { starStringTest } from "./regex-lib.js";
import { ValueCondition, isValueConditionGroup } from "./value-condition-types.js";

export const testValueCondition=(condition:ValueCondition,value:any):boolean=>{

    if(condition.path){
        value=getValueByPath(value,condition.path);
    }

    if(isValueConditionGroup(condition)){
        if(!condition.conditions){
            return false;
        }
        let count=0;
        const isOr=condition.op==='or';
        for(let i=0;i<condition.conditions.length;i++){
            const c=condition.conditions[i];
            if(!c){
                continue;
            }

            const r=testValueCondition(c,value);
            if(r){
                if(isOr){
                    return true;
                }
            }else{
                if(!isOr){
                    return false;
                }
            }

        }
        return count?(isOr):true;
    }

    const condValue=condition.value;

    switch(condition.op){

        case 'obj-in':
            return deepCompare(condValue,value,{ignoreExtraBKeys:true});

        case 'not-obj-in':
            return !deepCompare(condValue,value,{ignoreExtraBKeys:true});

        case 'obj-eq':
            return deepCompare(value,condValue);

        case 'not-obj-eq':
            return !deepCompare(value,condValue);

        case 'eq':
            return value===condValue;

        case 'not-eq':
            return value!==condValue;

        case 'lt':
            return condValue<value;

        case 'not-lt':
            return !(condValue<value);

        case 'gt':
            return condValue>value;

        case 'not-gt':
            return !(condValue>value);

        case 'lte':
            return condValue<=value;

        case 'not-lte':
            return !(condValue<=value);

        case 'gte':
            return condValue>=value;

        case 'not-gte':
            return !(condValue>=value);

        case 'in':
            return _in(value,condValue);

        case 'not-in':
            return !_in(value,condValue);

        case 'contains':
            return contains(value,condValue);

        case 'not-contains':
            return !contains(value,condValue);

        case 'starts-with':
            return startsWith(value,condValue);

        case 'not-starts-with':
            return !startsWith(value,condValue);

        case 'ends-with':
            return endsWith(value,condValue);

        case 'not-ends-with':
            return !endsWith(value,condValue);

        case 'match':
            return match(value,condValue);

        case 'not-match':
            return !match(value,condValue);

        case 'star-match':
            return starMatch(value,condValue);

        case 'not-star-match':
            return !starMatch(value,condValue);

        default:
            return false;
    }
}

const contains=(value:any,condValue:any)=>{
    if((typeof value === 'string') && (typeof condValue === 'string')){
        return condValue.includes(value);
    }else if(Array.isArray(condValue)){
        return condValue.includes(value);
    }else{
        return false;
    }
}
const _in=(value:any,condValue:any)=>{
    if((typeof value === 'string') && (typeof condValue === 'string')){
        return value.includes(condValue);
    }else if(Array.isArray(value)){
        return value.includes(condValue);
    }else{
        return false;
    }
}

const startsWith=(value:any,condValue:any)=>{
    if((typeof value === 'string') && (typeof condValue === 'string')){
        return value.startsWith(condValue);
    }else{
        return false;
    }
}

const endsWith=(value:any,condValue:any)=>{
    if((typeof value === 'string') && (typeof condValue === 'string')){
        return value.endsWith(condValue);
    }else{
        return false;
    }
}

const match=(value:any,condValue:any)=>{
    if(typeof value !== 'string'){
        return false;
    }
    try{
        if(typeof condValue === 'string'){
            const reg=new RegExp(condValue);
            return reg.test(value);
        }else if (condValue instanceof RegExp){
            return condValue.test(value);
        }else{
            return false;
        }
    }catch{
        return false;
    }
}

const starMatch=(value:any,condValue:any)=>{
    if((typeof value !== 'string') || (typeof condValue !== 'string')){
        return false;
    }else{
        return starStringTest(condValue,value);
    }
}

export interface CloneValueConditionOptions
{
    removeMetadata?:boolean;
}
export const cloneValueCondition=(value:ValueCondition,options?:CloneValueConditionOptions):ValueCondition=>{

    value={...value};

    if(options?.removeMetadata){
        delete value.metadata;
    }else if(value.metadata){
        value.metadata={...value.metadata}
    }

    if(isValueConditionGroup(value)){
        const cond=value.conditions;
        value.conditions=[];
        for(const c of cond){
            if(c){
                value.conditions.push(cloneValueCondition(c,options));
            }
        }
    }

    return value;
}

export const valueConditionHasValue=(value:ValueCondition):boolean=>{
    if(isValueConditionGroup(value)){
        for(let i=0;i<value.conditions.length;i++){
            const item=value.conditions[i];
            if(item && valueConditionHasValue(item)){
                return true;
            }
        }
        return false;
    }else{
        return true;
    }
}
