import { AttributeValue, UpdateItemInput } from "@aws-sdk/client-dynamodb";
import { convertToAttr, marshall } from '@aws-sdk/util-dynamodb';
import { deleteUndefined } from "@iyio/common";

const UpdateExpressionFlag=Symbol('UpdateExpressionFlag');

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface BaseUpdateExpression<T>
{
    /**
     * If not undefined add will be added to the current value of the target object.
     */
    add?:any;
}

export interface UpdateExpression<T> extends BaseUpdateExpression<T>
{
    typeFlag:typeof UpdateExpressionFlag;
}

export const createUpdateExpression=<T=any>(update:BaseUpdateExpression<T>):UpdateExpression<T>=>({
    typeFlag:UpdateExpressionFlag,
    ...update
})
export const isUpdateExpression=<T=any>(value:any):value is UpdateExpression<T>=>(
    value?(value as Partial<UpdateExpression<T>>).typeFlag===UpdateExpressionFlag:false
)

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
export function createItemUpdateInputOrNull<T>(
    tableName:string,
    key:Partial<T>,
    obj:ItemPatch<T>,
    doNotUpdateKeys=true,
    {
        incrementProp,
        incrementValue,
        matchCondition
    }:ExtendedItemUpdateOptions={}
):UpdateItemInput|null
{

    const names:Record<string,string>={}
    const values:Record<string,AttributeValue>={}
    const sets:string[]=[];
    const adds:string[]=[];

    const ip=typeof incrementProp === 'string'?incrementProp:undefined;

    let i=0;
    for(const e in obj){
        if((doNotUpdateKeys && key[e]!==undefined) || obj[e]===undefined || e===ip){
            continue;
        }

        const vk=':_'+i;
        const nk='#_'+i;
        const patchValue=obj[e];
        if(isUpdateExpression(patchValue)){
            if(patchValue.add!==undefined){
                values[vk]=convertToAttr(patchValue.add);
                names[nk]=e;
                adds.push(`${nk} ${vk}`);
            }else{
                continue;
            }
        }else{
            values[vk]=convertToAttr(patchValue);
            names[nk]=e;
            sets.push(`${nk} = ${vk}`)
        }
        i++;
    }


    if(ip){
        const vk=':_iv';
        const nk='#_iv'+i;
        values[vk]=convertToAttr(incrementValue??1);
        names[nk]=ip;
        adds.push(`${nk} ${vk}`)
        i++;
    }

    let condition:string|undefined=undefined;
    if(matchCondition){
        const keys=Object.keys(matchCondition);
        for(let i=0;i<keys.length;i++){
            const key=keys[i] as string;
            names[`#_cd_${i}`]=key;
            values[`:_cd_${i}`]=convertToAttr(matchCondition[key]);
        }
        condition=keys.map((k,i)=>`#_cd_${i} = :_cd_${i}`).join(' and ')
    }

    if(i===0){
        return null;
    }

    const input:UpdateItemInput={
        TableName:formatDynamoTableName(tableName),
        Key:marshall(key),
        ExpressionAttributeValues:values,
        ExpressionAttributeNames:names,
        UpdateExpression:[
            (sets.length?'SET '+(sets.join(', ')):''),
            (adds.length?'Add '+(adds.join(', ')):'')
        ].join(' ')
    }

    if(condition){
        input.ConditionExpression=condition;
    }

    return input;
}

export function createItemUpdateInput<T>(
    tableName:string,
    key:Partial<T>,
    obj:Partial<T>,
    doNotUpdateKeys=true
):UpdateItemInput
{

    const update=createItemUpdateInputOrNull(tableName,key,obj,doNotUpdateKeys);
    if(!update){
        throw new Error('not updates to be made')
    }

    return update;

}

export const formatDynamoTableName=(name:string):string=>
{
    const i=name.lastIndexOf('/');
    if(i===-1){
        return name;
    }

    return name.substring(i+1);
}

export const convertObjectToDynamoAttributes=(obj:Record<string,any>):Record<string,AttributeValue>=>{
    return marshall(deleteUndefined({...obj}));
}
