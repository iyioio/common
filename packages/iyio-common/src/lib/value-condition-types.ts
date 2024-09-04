export const allValueConditionOp=[
    'eq','not-eq',
    'lt','not-lt',
    'gt','not-gt',
    'lte','not-lte',
    'gte','not-gte',
    'in','not-in',
    'contains','not-contains',
    'starts-with','not-starts-with',
    'ends-with','not-ends-with',
    'match','not-match',
    'star-match','not-star-match',
    'obj-in','not-obj-in',
    'obj-eq','not-obj-eq',
    'no-op'
] as const;

export const isValueConditionOp=(value:any):value is ValueConditionOp=>{
    return allValueConditionOp.includes(value);
}

export type ValueConditionOp=typeof allValueConditionOp[number];
export type ValueConditionGroupOp='and'|'or';

export interface ValueConditionValue
{
    op:ValueConditionOp;
    value:any;
    path?:string;
    /**
     * Can be used by to indicate the value should be evaluated. By default evalValue has no effect
     * on value conditions but may have an effect on systems that build on top of value conditions.
     */
    evalValue?:boolean;
    metadata?:Record<string,any>;
}

export const isValueConditionGroup=(value:ValueCondition|null|undefined):value is ValueConditionGroup=>{
    if(!value){
        return false;
    }
    return value.op==='and' || value.op==='or';
}

export interface ValueConditionGroup
{
    op:ValueConditionGroupOp;
    conditions:(ValueCondition|null|undefined)[];
    path?:string;
    metadata?:Record<string,any>;
}

export type ValueCondition=ValueConditionGroup|ValueConditionValue;
