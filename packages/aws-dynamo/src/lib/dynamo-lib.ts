import { AttributeValue, UpdateItemInput } from "@aws-sdk/client-dynamodb";
import { convertToAttr, marshall } from '@aws-sdk/util-dynamodb';


export function createItemUpdateInputOrNull<T>(
    tableName:string,
    key:Partial<T>,
    obj:Partial<T>,
    doNotUpdateKeys:boolean=true
):UpdateItemInput|null
{

    const names:Record<string,string>={}
    const values:Record<string,AttributeValue>={}
    let expression='SET';

    let i=0;
    for(const e in obj){
        if((doNotUpdateKeys && key[e]!==undefined) || obj[e]===undefined){
            continue;
        }

        const vk=':'+e;
        const nk='#N'+i;
        values[vk]=convertToAttr(obj[e]);
        names[nk]=e;
        expression=`${expression}${i?',':''} ${nk} = ${vk}`
        i++;
    }

    if(i===0){
        return null;
    }

    return {
        TableName:tableName,
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
