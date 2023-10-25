import { ZodType, z } from "zod";
import { ConvoBaseType, OptionalConvoValue, isConvoBaseType, isConvoTypeDef, isOptionalConvoValue } from "./convo-types";


export const convoValueToZodType=(value:any,maxDepth=100):ZodType<any>=>{

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
            zType=convoValueToZodType(value[0],maxDepth);
        }
    }else if(isConvoTypeDef(value)){
        if(isConvoBaseType(value.type)){
            zType=convoBaseTypeToZodType(value.type);
        }else{
            zType=z.unknown();
        }
    }else{
        switch(value){
            case undefined: zType=z.undefined(); break;
            case null: zType=z.null(); break;
            default:
                if(typeof value === 'object'){
                    const shape=convoParamsToZodShape(value,maxDepth);
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

    return zType;

}

export const convoParamsToZodShape=(params:Record<string,any>,maxDepth=100):Record<string,ZodType<any>>=>{

    maxDepth--;

    const shape:Record<string,ZodType<any>>={};

    for(const e in params){
        shape[e]=convoValueToZodType(params[e],maxDepth);
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
            throw new Error(`Unexpected ConvoBaseType - ${type}`);
    }
}
