export type ValueConditionOp=(
    'eq'|'not-eq'|
    'lt'|'not-lt'|
    'gt'|'not-gt'|
    'lte'|'not-lte'|
    'gte'|'not-gte'|
    'in'|'not-in'|
    'contains'|'not-contains'|
    'starts-with'|
    'not-starts-with'|
    'ends-with'|
    'not-ends-with'|
    'match'|'not-match'|
    'star-match'|'not-star-match'|
    'obj-in'|'not-obj-in'|
    'obj-eq'|'not-obj-eq'
);
export type ValueConditionGroupOp='and'|'or';

export interface ValueConditionValue
{
    op:ValueConditionOp;
    value:any;
    path?:string;
}

export const isValueConditionGroup=(value:ValueCondition):value is ValueConditionGroup=>{
    return value.op==='and' || value.op==='or';
}

export interface ValueConditionGroup
{
    op:ValueConditionGroupOp;
    conditions:(ValueCondition|null|undefined)[];
    path?:string;
}

export type ValueCondition=ValueConditionGroup|ValueConditionValue;
