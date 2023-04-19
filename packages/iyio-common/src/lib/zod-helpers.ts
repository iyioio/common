import { ZodBoolean, ZodEnum, ZodError, ZodLazy, ZodLazyDef, ZodNull, ZodNumber, ZodOptional, ZodString, ZodTypeAny, ZodUndefined } from "zod";
import { TsPrimitiveType, allTsPrimitiveTypes } from "./typescript-types";

export const getZodErrorMessage=(zodError:ZodError):string=>{
    return zodError.message;
}

export const zodTypeToPrimitiveType=(type:ZodTypeAny):TsPrimitiveType|undefined=>{

    return _zodTypeToPrimitiveType(type,10);
}

const _zodTypeToPrimitiveType=(type:ZodTypeAny,depth:number):TsPrimitiveType|undefined=>{

    if(depth<=0){
        return undefined;
    }

    if(type instanceof ZodOptional){
        type=type.unwrap();
    }

    if(type instanceof ZodString){
        return 'string';
    }else if(type instanceof ZodNumber){
        return 'number';
    }else if(type instanceof ZodBoolean){
        return 'boolean';
    }else if(type instanceof ZodNull){
        return 'null';
    }else if(type instanceof ZodUndefined){
        return 'undefined';
    }else if(type instanceof ZodLazy){
        const inner=(type._def as ZodLazyDef)?.getter?.();
        return inner?_zodTypeToPrimitiveType(inner,depth-1):undefined;
    }else if(type instanceof ZodEnum){
        return getZodEnumPrimitiveType(type);
    }else{
        return undefined;
    }
}

export const getZodEnumPrimitiveType=(type:ZodEnum<any>):TsPrimitiveType|undefined=>{
    const values=type._def.values;
    if(!Array.isArray(values)){
        return undefined;
    }
    const tsType=typeof values[0];
    if(!tsType || !allTsPrimitiveTypes.includes(tsType as TsPrimitiveType)){
        return undefined;
    }

    for(let i=1;i<values.length;i++){
        if(typeof values[i] !== tsType){
            return undefined;
        }
    }

    return tsType as TsPrimitiveType;

}
