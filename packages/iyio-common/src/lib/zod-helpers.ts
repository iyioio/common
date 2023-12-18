import { ZodArray, ZodBoolean, ZodEnum, ZodError, ZodLazy, ZodLazyDef, ZodLiteral, ZodNull, ZodNullable, ZodNumber, ZodObject, ZodOptional, ZodSchema, ZodString, ZodType, ZodTypeAny, ZodUndefined, ZodUnion } from "zod";
import { JsonScheme } from "./json-scheme";
import { TsPrimitiveType, allTsPrimitiveTypes } from "./typescript-types";

export const getZodErrorMessage=(zodError:ZodError):string=>{
    return zodError.message;
}

export const zodTypeToPrimitiveType=(type:ZodTypeAny):TsPrimitiveType|undefined=>{

    return _zodTypeToPrimitiveType(type,10);
}

export const isZodArray=(type:ZodTypeAny):boolean=>{
    return unwrapZodType(type) instanceof ZodArray;
}

export const unwrapZodType=(type:ZodTypeAny,maxUnwrap=20):ZodTypeAny=>{
    for(let i=0;i<maxUnwrap;i++){
        let updated=false;

        if(type instanceof ZodOptional){
            type=type.unwrap();
            updated=true;
        }

        if(type instanceof ZodNullable){
            type=type.unwrap();
            updated=true;
        }

        if(!updated){
            break;
        }
    }
    return type;
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
const isObj=(value:any): value is ZodObject<any>=>{
    return typeof value?.shape === 'object';
}

export const zodCoerceObject=<T>(scheme:ZodSchema<T>,obj:Record<string,any>):{result?:T,error?:ZodError}=>{
    if(!isObj(scheme)){
        const fallback=scheme.safeParse(obj);
        return fallback.success?{result:fallback.data}:fallback.success===false?{error:fallback.error}:{}
    }
    const output:Record<string,any>={};
    for(const e in scheme.shape){
        const prop:ZodType<any>=scheme.shape[e];
        const value=obj[e];
        if(!prop || value===undefined){
            continue;
        }
        const parsed=prop.safeParse(value);
        if(parsed.success){
            output[e]=parsed.data;
        }else{
            const strValue=value===null?'null':(typeof value === 'string')?value:value.toString() as string;
            switch(zodTypeToPrimitiveType(prop)){

                case "boolean":
                    output[e]=Boolean(strValue);
                    break;

                case "number":
                    output[e]=Number(strValue);
                    break;

                case "string":
                    output[e]=strValue;
                    break;

                case "null":
                    output[e]=null;
                    break;
            }
        }
    }

    const parsedResult=scheme.safeParse(output);
    if(parsedResult.success){
        return {result:parsedResult.data};
    }else if(parsedResult.success===false){
        return {error:parsedResult.error}
    }else{
        return {}
    }
}

export const zodCoerceNullDbValuesInObject=<T>(scheme:ZodSchema<T>,obj:Record<string,any>)=>{
    if(!isObj(scheme)){
        return;
    }
    const output:Record<string,any>={};
    for(const e in scheme.shape){
        const prop:ZodType<any>=scheme.shape[e];
        const value=obj[e];
        if(!prop || value===undefined){
            continue;
        }
        if(value===null){
            if(prop.isNullable()){
                continue;
            }
            if(prop.isOptional()){
                delete obj[e];
                continue;
            }
            if(prop instanceof ZodArray){
                obj[e]=[];
                continue;
            }
            throw new Error(`Unable to coerce NULL db value. prop=${e}`);
        }
        // todo - add support for recursive checking of objects and array values
    }

    const parsedResult=scheme.safeParse(output);
    if(parsedResult.success){
        return {result:parsedResult.data};
    }else if(parsedResult.success===false){
        return {error:parsedResult.error}
    }else{
        return {}
    }
}


const cacheKey=Symbol('zodHelperCacheKey');

export const zodTypeToJsonScheme=(scheme:ZodTypeAny,maxDepth=10,cache=true):JsonScheme|undefined=>{
    const cached=cache?(scheme as any)[cacheKey]:undefined;
    if(cached){
        return cached;
    }
    const v=_zodTypeToJsonScheme(scheme,maxDepth)?.jsonType;
    if(cache){
        (scheme as any)[cacheKey]=v;
    }
    return v;
}



const _zodTypeToJsonScheme=(type:ZodTypeAny,depth:number):{jsonType:JsonScheme,optional:boolean}|undefined=>{

    if(depth<=0){
        return undefined;
    }

    const description=type.description;

    let optional=false;
    if(type instanceof ZodOptional){
        type=type.unwrap();
        optional=true;
    }

    const jsonType:JsonScheme={}

    if(type instanceof ZodString){
        jsonType.type='string';
    }else if(type instanceof ZodNumber){
        jsonType.type=type._def.checks.some(c=>c.kind==='int')?'integer':'number';
    }else if(type instanceof ZodBoolean){
        jsonType.type='boolean';
    }else if(type instanceof ZodNull){
        jsonType.type='null';
    }else if(type instanceof ZodUndefined){
        return undefined;
    }else if(type instanceof ZodLazy){
        const inner=(type._def as ZodLazyDef)?.getter?.();
        return inner?_zodTypeToJsonScheme(inner,depth-1):undefined;
    }else if(type instanceof ZodEnum){
        const tsType=getZodEnumPrimitiveType(type);
        if(tsType!=='undefined'){
            jsonType.type=tsType;
        }
        const values=type._def.values;
        if(Array.isArray(values)){
            jsonType.enum=[...values];
        }
    }else if(type instanceof ZodUnion){
        jsonType.enum=[];
        const values=type._def.options;
        for(const v of values){
            if(v instanceof ZodLiteral){
                jsonType.enum.push(v.value);
            }
        }
    }else if(type instanceof ZodObject){
        jsonType.type='object';
        const required:string[]=[];
        const properties:Record<string,JsonScheme>={};
        for(const e in type.shape){
            const prop=_zodTypeToJsonScheme(type.shape[e],depth-1);
            if(!prop){
                continue;
            }
            if(!prop.optional){
                required.push(e);
            }
            properties[e]=prop.jsonType;
        }
        if(required.length){
            jsonType.required=required;
        }
        jsonType.properties=properties;

    }else if(type instanceof ZodArray){
        jsonType.type='array';
        const itemType=_zodTypeToJsonScheme(type._def.type,depth-1);
        if(itemType){
            jsonType.items=itemType.jsonType;
        }else{
            jsonType.items=false;
        }
    }else{
        return undefined;
    }

    if(description){
        jsonType.description=description;
    }

    return {jsonType,optional};
}
