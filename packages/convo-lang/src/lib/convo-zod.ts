import { ZodType, z } from "zod";
import { ConvoError } from "./ConvoError";
import { convoMetadataKey } from "./convo-lib";
import { ConvoBaseType, ConvoMetadata, OptionalConvoValue, isConvoBaseType, isConvoTypeDef, isOptionalConvoValue } from "./convo-types";

const typeCacheKey=Symbol('typeCacheKey');

export const convoValueToZodType=(value:any,maxDepth=100,cache=true):ZodType<any>=>{
    if(cache && value && value[typeCacheKey]){
        return value[typeCacheKey];
    }
    const type=_convoValueToZodType(value,value?.[convoMetadataKey],maxDepth);
    if(cache && value){
        value[typeCacheKey]=type;
    }
    return type;
}

const _convoValueToZodType=(value:any,metadata:ConvoMetadata|undefined,maxDepth=100):ZodType<any>=>{

    maxDepth--;
    if(maxDepth<0){
        return z.any();
    }

    let isOptional=false;
    let isArray=false;
    if(isOptionalConvoValue(value)){
        isOptional=true;
        value=(value as OptionalConvoValue).value;
    }
    let zType:ZodType<any>;

    if(Array.isArray(value)){
        isArray=true;
        if(value.length===0){
            zType=z.any();
        }else{
            zType=_convoValueToZodType(value[0],undefined,maxDepth);
        }
    }else if(isConvoTypeDef(value)){
        if(isConvoBaseType(value.type)){
            zType=convoBaseTypeToZodType(value.type);
        }else if(value.enumValues){
            if(value.enumValues.length===0){
                zType=z.enum(['']);
            }else{
                let allStrings=true;
                for(let ei=0;ei<value.enumValues.length;ei++){
                    if(!(typeof value.enumValues[ei] === 'string')){
                        allStrings=false;
                        break;
                    }
                }
                if(allStrings){
                    zType=z.enum(value.enumValues as any);
                }else{
                    zType=z.union(value.enumValues.map(v=>z.literal(v)) as any);
                }
            }
        }else{
            zType=z.unknown();
        }
    }else{
        switch(value){
            case undefined: zType=z.undefined(); break;
            case null: zType=z.null(); break;
            default:
                if(typeof value === 'object'){
                    const shape=_convoParamsToZodShape(value,metadata,maxDepth);
                    zType=z.object(shape);
                }else{
                    zType=z.literal(value);
                }
        }
    }

    if(isArray){
        zType=zType.array();
    }

    if(isOptional){
        zType=zType.optional();
    }

    if(metadata?.comment){
        zType=zType.describe(metadata.comment);
    }

    return zType;

}

export const convoParamsToZodShape=(params:Record<string,any>,maxDepth=100):Record<string,ZodType<any>>=>{

    return _convoParamsToZodShape(params,undefined,maxDepth);
}

const _convoParamsToZodShape=(params:Record<string,any>,metadata:ConvoMetadata|undefined,maxDepth=100):Record<string,ZodType<any>>=>{

    maxDepth--;

    const shape:Record<string,ZodType<any>>={};

    for(const e in params){
        const v=params[e];
        shape[e]=_convoValueToZodType(v,metadata?.properties?.[e]??v?.[convoMetadataKey],maxDepth);
    }

    return shape;
}

export const convoBaseTypeToZodType=(type:ConvoBaseType):ZodType<any>=>{
    switch(type){
        case 'string': return z.string();
        case 'boolean': return z.boolean();
        case 'number': return z.number();
        case 'time': return z.number();
        case 'void': return z.void();
        case 'int': return z.number().int();
        case 'array': return z.any().array();
        case 'map': return z.record(z.string());
        case 'any': return z.any();
        default:
            throw new ConvoError(
                'unexpected-base-type',
                {baseType:type},
                `Unexpected ConvoBaseType - ${type}`
            );
    }
}
