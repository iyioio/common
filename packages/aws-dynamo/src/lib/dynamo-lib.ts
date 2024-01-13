import { AttributeValue, QueryCommandInput, ScanCommandInput, UpdateItemInput } from "@aws-sdk/client-dynamodb";
import { convertToAttr, marshall } from '@aws-sdk/util-dynamodb';
import { deleteUndefined, getObjKeyCount } from "@iyio/common";
import { ExtendedItemUpdateOptions, ItemPatch, QueryMatchTableOptions, ScanMatchTableOptions, isFilterExpression, isUpdateExpression } from "./dynamo-types";


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
    const removeProperties:string[]=[];

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
            }else if(patchValue.listPush){
                values[vk]=convertToAttr(patchValue.listPush);
                names[nk]=e;
                sets.push(`${nk} = list_append(${nk}, ${vk})`);
            }else if(patchValue.listUnshift){
                values[vk]=convertToAttr(patchValue.listUnshift);
                names[nk]=e;
                sets.push(`${nk} = list_append(${vk}, ${nk})`);
            }else if(patchValue.removeProperty===true){
                names[nk]=e;
                removeProperties.push(`${nk}`);
            }
        }else{
            values[vk]=convertToAttr(patchValue);
            names[nk]=e;
            sets.push(`${nk} = ${vk}`);
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
            (adds.length?'ADD '+(adds.join(', ')):''),
            (removeProperties.length?'REMOVE '+(removeProperties.join(', ')):''),
        ].join(' ')
    }

    if(condition){
        input.ConditionExpression=condition;
    }

    if(input.ExpressionAttributeNames && getObjKeyCount(input.ExpressionAttributeNames)===0){
        delete input.ExpressionAttributeNames;
    }

    if(input.ExpressionAttributeValues && getObjKeyCount(input.ExpressionAttributeValues)===0){
        delete input.ExpressionAttributeValues;
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



export const getScanCommandInput=<T>({
    forEachPage,
    index,
    filter,
    commandInput={},
    pageKey,
    projectionProps,
    limit=forEachPage?100:undefined,
    returnAll=forEachPage?true:undefined,
}:ScanMatchTableOptions<T>):Partial<ScanCommandInput>=>{

    const input:Partial<ScanCommandInput>={
        IndexName:index?.name,
        ExpressionAttributeNames:{},
        ExpressionAttributeValues:{},
        ExclusiveStartKey:pageKey,
        ProjectionExpression:projectionProps?.map((p,i)=>`#_projected${i}`).join(','),
        Limit:limit,
    };

    if(projectionProps){
        for(let i=0;i<projectionProps.length;i++){
            (input.ExpressionAttributeNames as any)[`#_projected${i}`]=projectionProps[i]
        }
    }

    if(filter){
        const keys=Object.keys(filter);
        const exp:string[]=[];
        let expI=0;
        let filterCount=0;
        for(let i=0;i<keys.length;i++){
            const key=keys[i] as keyof T;
            const value=filter[key];
            if(value===undefined){
                continue;
            }
            filterCount++;
            if(isFilterExpression(value)){

                if(value.isIn!==undefined){
                    const xi=expI++;
                    (input.ExpressionAttributeNames as any)[`#_${xi}_filter${keys[i]}`]=key;
                    const vKeys:string[]=[];
                    for(const inValue of value.isIn){
                        const vKey=`:_${xi}_${vKeys.length}_filter${keys[i]}`;
                        (input.ExpressionAttributeValues as any)[vKey]=convertToAttr(inValue);
                        vKeys.push(vKey);
                    }
                    exp.push(`#_${xi}_filter${key as string} in ( ${vKeys.join(',')} )`)
                }

                if(value.type!==undefined){
                    const xi=expI++;
                    (input.ExpressionAttributeNames as any)[`#_${xi}_filter${keys[i]}`]=key;
                    (input.ExpressionAttributeValues as any)[`:_${xi}_filter${keys[i]}`]=convertToAttr(value.type);
                    exp.push(`attribute_type(#_${xi}_filter${key as string}, :_${xi}_filter${key as string})`)
                }

                if(value.startsWith!==undefined){
                    const xi=expI++;
                    (input.ExpressionAttributeNames as any)[`#_${xi}_filter${keys[i]}`]=key;
                    (input.ExpressionAttributeValues as any)[`:_${xi}_filter${keys[i]}`]=convertToAttr(value.startsWith);
                    exp.push(`begins_with(#_${xi}_filter${key as string}, :_${xi}_filter${key as string})`)
                }

                if(value.contains!==undefined){
                    const xi=expI++;
                    (input.ExpressionAttributeNames as any)[`#_${xi}_filter${keys[i]}`]=key;
                    (input.ExpressionAttributeValues as any)[`:_${xi}_filter${keys[i]}`]=convertToAttr(value.contains);
                    exp.push(`contains(#_${xi}_filter${key as string}, :_${xi}_filter${key as string})`)
                }

                if(value.valueContainsProperty!==undefined){
                    const xi=expI++;
                    (input.ExpressionAttributeNames as any)[`#_${xi}_filter${keys[i]}`]=key;
                    (input.ExpressionAttributeValues as any)[`:_${xi}_filter${keys[i]}`]=convertToAttr(value.valueContainsProperty);
                    exp.push(`contains(:_${xi}_filter${key as string}, #_${xi}_filter${key as string})`)
                }

                if(value.exists!==undefined){
                    const xi=expI++;
                    (input.ExpressionAttributeNames as any)[`#_${xi}_filter${keys[i]}`]=key;
                    exp.push(`${value.exists?'attribute_exists':'attribute_not_exists'}(#_${xi}_filter${key as string})`)
                }

                if(value.eq!==undefined){
                    const xi=expI++;
                    (input.ExpressionAttributeNames as any)[`#_${xi}_filter${keys[i]}`]=key;
                    (input.ExpressionAttributeValues as any)[`:_${xi}_filter${keys[i]}`]=convertToAttr(value.eq);
                    if(value.size){
                        exp.push(`size(#_${xi}_filter${key as string}) = :_${xi}_filter${key as string}`);
                    }else{
                        exp.push(`#_${xi}_filter${key as string} = :_${xi}_filter${key as string}`)
                    }
                }

                if(value.neq!==undefined){
                    const xi=expI++;
                    (input.ExpressionAttributeNames as any)[`#_${xi}_filter${keys[i]}`]=key;
                    (input.ExpressionAttributeValues as any)[`:_${xi}_filter${keys[i]}`]=convertToAttr(value.neq);
                    if(value.size){
                        exp.push(`size(#_${xi}_filter${key as string}) <> :_${xi}_filter${key as string}`);
                    }else{
                        exp.push(`#_${xi}_filter${key as string} <> :_${xi}_filter${key as string}`)
                    }
                }

                if(value.lt!==undefined){
                    const xi=expI++;
                    (input.ExpressionAttributeNames as any)[`#_${xi}_filter${keys[i]}`]=key;
                    (input.ExpressionAttributeValues as any)[`:_${xi}_filter${keys[i]}`]=convertToAttr(value.lt);
                    if(value.size){
                        exp.push(`size(#_${xi}_filter${key as string}) < :_${xi}_filter${key as string}`);
                    }else{
                        exp.push(`#_${xi}_filter${key as string} < :_${xi}_filter${key as string}`)
                    }
                }

                if(value.lte!==undefined){
                    const xi=expI++;
                    (input.ExpressionAttributeNames as any)[`#_${xi}_filter${keys[i]}`]=key;
                    (input.ExpressionAttributeValues as any)[`:_${xi}_filter${keys[i]}`]=convertToAttr(value.lte);
                    if(value.size){
                        exp.push(`size(#_${xi}_filter${key as string}) <= :_${xi}_filter${key as string}`);
                    }else{
                        exp.push(`#_${xi}_filter${key as string} <= :_${xi}_filter${key as string}`)
                    }
                }

                if(value.mt!==undefined){
                    const xi=expI++;
                    (input.ExpressionAttributeNames as any)[`#_${xi}_filter${keys[i]}`]=key;
                    (input.ExpressionAttributeValues as any)[`:_${xi}_filter${keys[i]}`]=convertToAttr(value.mt);
                    if(value.size){
                        exp.push(`size(#_${xi}_filter${key as string}) > :_${xi}_filter${key as string}`);
                    }else{
                        exp.push(`#_${xi}_filter${key as string} > :_${xi}_filter${key as string}`)
                    }
                }

                if(value.mte!==undefined){
                    const xi=expI++;
                    (input.ExpressionAttributeNames as any)[`#_${xi}_filter${keys[i]}`]=key;
                    (input.ExpressionAttributeValues as any)[`:_${xi}_filter${keys[i]}`]=convertToAttr(value.mte);
                    if(value.size){
                        exp.push(`size(#_${xi}_filter${key as string}) >= :_${xi}_filter${key as string}`);
                    }else{
                        exp.push(`#_${xi}_filter${key as string} >= :_${xi}_filter${key as string}`)
                    }
                }

            }else{
                (input.ExpressionAttributeNames as any)[`#_filter${keys[i]}`]=key;
                (input.ExpressionAttributeValues as any)[`:_filter${keys[i]}`]=convertToAttr(filter[key]);
                exp.push(`#_filter${key as string} = :_filter${key as string}`)

            }
        }
        if(filterCount){
            input.FilterExpression=exp.join(' and ');
        }
    }

    if(commandInput){
        for(const e in commandInput){
            (input as any)[e]=(commandInput as any)[e];
        }
    }

    if(returnAll && !forEachPage){
        delete input.Limit;
    }

    if(input.ExpressionAttributeNames && getObjKeyCount(input.ExpressionAttributeNames)===0){
        delete input.ExpressionAttributeNames;
    }

    if(input.ExpressionAttributeValues && getObjKeyCount(input.ExpressionAttributeValues)===0){
        delete input.ExpressionAttributeValues;
    }

    deleteUndefined(input);

    return input;
}

export const getQueryCommandInput=<T>({
    matchKey,
    reverseOrder,
    commandInput,
    ...scanOptions
}:QueryMatchTableOptions<T>):Partial<QueryCommandInput>=>{

    const input:Partial<QueryCommandInput>={
        ...getScanCommandInput(scanOptions),
        ScanIndexForward:!reverseOrder,
    }

    if(!input.ExpressionAttributeNames){
        input.ExpressionAttributeNames={};
    }

    if(!input.ExpressionAttributeValues){
        input.ExpressionAttributeValues={};
    }

    if(matchKey){
        const keys=Object.keys(matchKey);
        input.KeyConditionExpression=keys.map(k=>`#_key${k} = :_key${k}`).join(',');
        for(let i=0;i<keys.length;i++){
            const key=keys[i] as keyof T;
            (input.ExpressionAttributeNames as any)[`#_key${keys[i]}`]=key;
            (input.ExpressionAttributeValues as any)[`:_key${keys[i]}`]=convertToAttr(matchKey[key]);
        }
    }

    if(commandInput){
        for(const e in commandInput){
            (input as any)[e]=(commandInput as any)[e];
        }
    }

    deleteUndefined(input);

    if(input.ExpressionAttributeNames && getObjKeyCount(input.ExpressionAttributeNames)===0){
        delete input.ExpressionAttributeNames;
    }

    if(input.ExpressionAttributeValues && getObjKeyCount(input.ExpressionAttributeValues)===0){
        delete input.ExpressionAttributeValues;
    }

    return input;
}
