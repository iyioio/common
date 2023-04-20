import { AttributeValue, UpdateItemInput } from "@aws-sdk/client-dynamodb";
import { convertToAttr, marshall } from '@aws-sdk/util-dynamodb';
import { deleteUndefined } from "@iyio/common";

export interface ExtendedItemUpdateOptions<T=any>
{
    incrementProp?:keyof T;
    incrementValue?:number;
}
export function createItemUpdateInputOrNull<T>(
    tableName:string,
    key:Partial<T>,
    obj:Partial<T>,
    doNotUpdateKeys:boolean=true,
    extendedOptions?:ExtendedItemUpdateOptions
):UpdateItemInput|null
{

    const names:Record<string,string>={}
    const values:Record<string,AttributeValue>={}
    let expression='SET';

    const incrementProp=typeof extendedOptions?.incrementProp === 'string'?extendedOptions?.incrementProp:undefined;

    let i=0;
    for(const e in obj){
        if((doNotUpdateKeys && key[e]!==undefined) || obj[e]===undefined || e===incrementProp){
            continue;
        }

        const vk=':'+e;
        const nk='#N'+i;
        values[vk]=convertToAttr(obj[e]);
        names[nk]=e;
        expression=`${expression}${i?',':''} ${nk} = ${vk}`
        i++;
    }


    if(incrementProp){
        const vk=':__incrementValue';
        const nk='#N'+i;
        values[vk]=convertToAttr(extendedOptions?.incrementValue??1);
        names[nk]=incrementProp;
        expression=`${expression}${i?',':''} ${nk} = ${nk} + ${vk}`
        i++;
    }

    if(i===0){
        return null;
    }

    return {
        TableName:formatDynamoTableName(tableName),
        Key:marshall(key),
        ExpressionAttributeValues:values,
        ExpressionAttributeNames:names,
        UpdateExpression:expression
    }
}

export function createItemUpdateInput<T>(
    tableName:string,
    key:Partial<T>,
    obj:Partial<T>,
    doNotUpdateKeys:boolean=true
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
