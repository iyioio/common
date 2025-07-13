import { ZodAny, ZodArray, ZodBoolean, ZodEnum, ZodError, ZodLazy, ZodLazyDef, ZodLiteral, ZodNull, ZodNullable, ZodNumber, ZodObject, ZodOptional, ZodRecord, ZodSchema, ZodString, ZodType, ZodTypeAny, ZodUndefined, ZodUnion, z } from "zod";
import { JsonScheme } from "./json-scheme";
import { TsPrimitiveType, allTsPrimitiveTypes } from "./typescript-types";

export const getZodErrorMessage=(zodError:ZodError):string=>{
    return zodError.issues[0]?.message??zodError.message;
}

export const zodTypeToPrimitiveType=(type:ZodTypeAny):TsPrimitiveType|undefined=>{

    return _zodTypeToPrimitiveType(type,10);
}

export const isZodArray=(type:ZodTypeAny):boolean=>{
    return valueIsZodArray(unwrapZodType(type));
}

const getName=(type:any)=>{
    return type?._def?.typeName || type?.def?.type;
}

export const getZodTypeName=(type:ZodTypeAny|null|undefined):string|undefined=>{
    if(!type){
        return undefined;
    }
    const name:string=((type as any)?._def?.typeName || (type as any)?.def?.type)?.toLowerCase?.();
    if(!name){
        return undefined;
    }else if(name.startsWith('zod')){
        return name.substring(3);
    }else{
        return name;
    }
}

export const unwrapZodType=(type:ZodTypeAny,maxUnwrap=20):ZodTypeAny=>{
    for(let i=0;i<maxUnwrap;i++){
        const name=getName(type);

        if(name==='ZodLazy' || name==='lazy'){
            const inner=(((type as any)._def ?? (type as any).def) as ZodLazyDef)?.getter?.();
            if(!inner){
                break;
            }
            type=inner;
        }

        if(!(type as any).unwrap || (name!=='ZodOptional' && name!=='optional' && name!=='ZodNullable' && name!=='nullable')){
            break;
        }
        type=(type as any).unwrap();
        maxUnwrap--;
    }
    return type;
}

const _zodTypeToPrimitiveType=(type:ZodTypeAny,depth:number):TsPrimitiveType|undefined=>{

    if(depth<=0){
        return undefined;
    }

    type=unwrapZodType(type);

    if(valueIsZodString(type)){
        return 'string';
    }else if(valueIsZodNumber(type)){
        return 'number';
    }else if(valueIsZodBoolean(type)){
        return 'boolean';
    }else if(valueIsZodNull(type)){
        return 'null';
    }else if(valueIsZodUndefined(type)){
        return 'undefined';
    }else if(valueIsZodLazy(type)){
        const inner=(type._def as ZodLazyDef)?.getter?.();
        return inner?_zodTypeToPrimitiveType(inner,depth-1):undefined;
    }else if(valueIsZodEnum(type)){
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

export const zodCoercePrimitiveType=(type:ZodType,value:any)=>{
    switch(zodTypeToPrimitiveType(type)){

        case "boolean":
            return Boolean(value);

        case "number":{
            const v=Number(value);
            return isFinite(v)?v:0;
        }

        case "string":
            return value?.toString()??'';

        case "null":
            return null;
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
            if(valueIsZodArray(prop)){
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

export const zodTypeToJsonScheme=(scheme:ZodTypeAny,maxDepth=50,cache=true):JsonScheme|undefined=>{
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



const _zodTypeToJsonScheme=(type:ZodTypeAny,depth:number,optional=false,description?:string):{jsonType:JsonScheme,optional:boolean}|undefined=>{

    if(depth<=0){
        return undefined;
    }

    description=type.description||description;

    if(valueIsZodOptional(type)){
        type=unwrapZodType(type);
        optional=true;
    }

    const jsonType:JsonScheme={}

    if(valueIsZodString(type)){
        jsonType.type='string';
    }else if(valueIsZodNumber(type)){
        jsonType.type=type._def.checks.some(c=>c.kind==='int')?'integer':'number';
    }else if(valueIsZodBoolean(type)){
        jsonType.type='boolean';
    }else if(valueIsZodNull(type)){
        jsonType.type='null';
    }else if(valueIsZodUndefined(type)){
        return undefined;
    }else if(valueIsZodLazy(type)){
        const inner=(type._def as ZodLazyDef)?.getter?.();
        return inner?_zodTypeToJsonScheme(inner,depth-1,optional,description):undefined;
    }else if(valueIsZodEnum(type)){
        const tsType=getZodEnumPrimitiveType(type);
        if(tsType!=='undefined'){
            jsonType.type=tsType;
        }
        const values=type._def.values;
        if(Array.isArray(values)){
            jsonType.enum=[...values];
        }
    }else if(valueIsZodUnion(type)){
        jsonType.enum=[];
        const values=type._def.options;
        for(const v of values){
            if(valueIsZodLiteral(v)){
                jsonType.enum.push(v.value);
            }
        }
    }else if(valueIsZodObject(type)){
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

    }else if(valueIsZodArray(type)){
        jsonType.type='array';
        const itemType=_zodTypeToJsonScheme(type._def.type,depth-1);
        if(itemType){
            jsonType.items=itemType.jsonType;
        }else{
            jsonType.items=false;
        }
    }else if(valueIsZodRecord(type)){
        jsonType.type='object';
    }else if(valueIsZodAny(type)){
        // do nothing
    }else{
        return undefined;
    }

    if(description){
        jsonType.description=description;
    }

    return {jsonType,optional};
}

export type ZodDeepOptionalPropConfigValue=boolean|ZodDeepOptionalSubPropConfig|'skip';
export type ZodDeepOptionalPropConfig=Record<string,ZodDeepOptionalPropConfigValue>;
export interface ZodDeepOptionalSubPropConfig
{
    required?:boolean;
    props?:ZodDeepOptionalPropConfig;
}
export interface ZodDeepOptionalOptions
{
    maxDepth?:number;
    propConfig?:ZodDeepOptionalPropConfig;
}

/**
 * Converts the passed type and all decedents of the type to optionals. This function does not
 * work correctly with types with reference loops that use lazy loading
 */
export const zodDeepOptional=(type:ZodTypeAny,{
    maxDepth=20,
    propConfig
}:ZodDeepOptionalOptions={}):ZodTypeAny=>{
    return _zodDeepOptional(type,maxDepth+1,[],propConfig?{props:propConfig}:undefined);
}

export const _zodDeepOptional=(
    type:ZodTypeAny,
    depth:number,
    converted:{from:ZodTypeAny,to:ZodTypeAny}[],
    propConfig:ZodDeepOptionalPropConfigValue|undefined
):ZodTypeAny=>{

    depth--;
    if(depth<0 || propConfig==='skip'){
        return type;
    }

    const config=propConfig && (typeof propConfig === 'object')?propConfig:undefined

    const isOptional=(
        propConfig===true?
            false
        :propConfig===false?
            true
        :
            !propConfig?.required
    )

    const unwrapped=unwrapZodType(type);

    if(valueIsZodObject(unwrapped)){
        const match=converted.find(c=>c.from===type);
        if(match){
            return match.to;
        }


        const newShape:Record<string,ZodTypeAny>={}
        for(const e in unwrapped.shape){
            newShape[e]=_zodDeepOptional(
                unwrapped.shape[e],
                depth,
                converted,
                config?.props?.[e]
            );
        }
        let newObj:ZodTypeAny=z.object(newShape);
        if(isOptional){
            newObj=newObj.optional();
        }
        converted.push({from:type,to:newObj});

        return newObj;
    }else if(valueIsZodArray(unwrapped)){
        const itemType=_zodDeepOptional(
            unwrapped._def.type,
            depth,
            converted,
            config?.props?.['items']??false
        );
        let newAry:ZodTypeAny=itemType.array();
        if(isOptional){
            newAry=newAry.optional();
        }
        converted.push({from:type,to:newAry});
        return newAry;
    }else{
        return isOptional?unwrapped.optional():unwrapped;
    }
}

export const valueIsZodOptional=(value:any):value is ZodOptional<any>=>{
    const name=getName(value);
    return name==='ZodOptional' || name==='optional';
}
export const valueIsZodString=(value:any):value is ZodString=>{
    const name=getName(value);
    return name==='ZodString' || name==='string';
}
export const valueIsZodNumber=(value:any):value is ZodNumber=>{
    const name=getName(value);
    return name==='ZodNumber' || name==='number';
}
export const valueIsZodBoolean=(value:any):value is ZodBoolean=>{
    const name=getName(value);
    return name==='ZodBoolean' || name==='boolean';
}
export const valueIsZodNull=(value:any):value is ZodNull=>{
    const name=getName(value);
    return name==='ZodNull' || name==='null';
}
export const valueIsZodUndefined=(value:any):value is ZodUndefined=>{
    const name=getName(value);
    return name==='ZodUndefined' || name==='undefined';
}
export const valueIsZodLazy=(value:any):value is ZodLazy<any>=>{
    const name=getName(value);
    return name==='ZodLazy' || name==='lazy';
}
export const valueIsZodEnum=(value:any):value is ZodEnum<any>=>{
    const name=getName(value);
    return name==='ZodEnum' || name==='enum';
}
export const valueIsZodUnion=(value:any):value is ZodUnion<any>=>{
    const name=getName(value);
    return name==='ZodUnion' || name==='union';
}
export const valueIsZodLiteral=(value:any):value is ZodLiteral<any>=>{
    const name=getName(value);
    return name==='ZodLiteral' || name==='literal';
}
export const valueIsZodObject=(value:any):value is ZodObject<any>=>{
    const name=getName(value);
    return name==='ZodObject' || name==='object';
}
export const valueIsZodArray=(value:any):value is ZodArray<any>=>{
    const name=getName(value);
    return name==='ZodArray' || name==='array';
}
export const valueIsZodRecord=(value:any):value is ZodRecord=>{
    const name=getName(value);
    return name==='ZodRecord' || name==='record';
}
export const valueIsZodAny=(value:any):value is ZodAny=>{
    const name=getName(value);
    return name==='ZodAny' || name==='any';
}
export const valueIsZodNullable=(value:any):value is ZodNullable<any>=>{
    const name=getName(value);
    return name==='ZodNullable' || name==='nullable';
}
export const valueIsZodType=(value:any):value is ZodType<any>=>{
    return getName(value)?true:false;
}
