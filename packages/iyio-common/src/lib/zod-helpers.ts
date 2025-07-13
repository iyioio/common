import { ZodAny, ZodArray, ZodBoolean, ZodEnum, ZodError, ZodLazy, ZodLazyDef, ZodLiteral, ZodNull, ZodNullable, ZodNumber, ZodObject, ZodOptional, ZodRecord, ZodSchema, ZodString, ZodType, ZodTypeAny, ZodUndefined, ZodUnion, z } from "zod";
import { JsonScheme } from "./json-scheme";
import { TsPrimitiveType, allTsPrimitiveTypes } from "./typescript-types";

/**
 * Extracts the first error message from a ZodError instance
 * @param zodError - The ZodError instance to extract the message from
 * @returns The first error message or the general error message
 */
export const getZodErrorMessage=(zodError:ZodError):string=>{
    return zodError.issues[0]?.message??zodError.message;
}

/**
 * Converts a Zod type to its corresponding TypeScript primitive type
 * @param type - The Zod type to convert
 * @returns The TypeScript primitive type or undefined if not convertible
 */
export const zodTypeToPrimitiveType=(type:ZodTypeAny):TsPrimitiveType|undefined=>{

    return _zodTypeToPrimitiveType(type,10);
}

/**
 * Checks if a Zod type is an array type after unwrapping
 * @param type - The Zod type to check
 * @returns True if the type is a Zod array
 */
export const isZodArray=(type:ZodTypeAny):boolean=>{
    return valueIsZodArray(unwrapZodType(type));
}

const getName=(type:any)=>{
    return type?._def?.typeName || type?.def?.type;
}

/**
 * Gets the type name of a Zod type, normalizing the format
 * @param type - The Zod type to get the name from
 * @returns The normalized type name or undefined if not available
 */
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

/**
 * Unwraps Zod types by removing optional, nullable, and lazy wrappers
 * @param type - The Zod type to unwrap
 * @param maxUnwrap - Maximum number of unwrap operations to prevent infinite loops
 * @returns The unwrapped Zod type
 */
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

/**
 * Determines the primitive type of a Zod enum if all values are of the same type
 * @param type - The Zod enum type to analyze
 * @returns The primitive type if all enum values are the same type, otherwise undefined
 */
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

/**
 * Coerces an object to match a Zod schema by converting primitive types
 * @param scheme - The Zod schema to validate against
 * @param obj - The object to coerce and validate
 * @returns An object containing either the coerced result or validation error
 */
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

/**
 * Coerces a value to match a Zod primitive type
 * @param type - The Zod type to coerce to
 * @param value - The value to coerce
 * @returns The coerced value or the original value if coercion is not applicable
 */
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

/**
 * Handles null values from database by converting them to appropriate types based on Zod schema
 * @param scheme - The Zod schema to validate against
 * @param obj - The object with potential null database values
 * @returns An object containing either the processed result or validation error
 */
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

/**
 * Converts a Zod type to a JSON schema representation
 * @param scheme - The Zod type to convert
 * @param maxDepth - Maximum recursion depth to prevent infinite loops
 * @param cache - Whether to cache the result on the schema object
 * @returns The JSON schema representation or undefined if conversion fails
 */
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
/**
 * Converts the passed type and all descendants to optional types recursively
 * @param type - The Zod type to make deeply optional
 * @param options - Configuration options for the conversion
 * @returns A new Zod type with all properties made optional
 */
export const zodDeepOptional=(type:ZodTypeAny,{
    maxDepth=20,
    propConfig
}:ZodDeepOptionalOptions={}):ZodTypeAny=>{
    return _zodDeepOptional(type,maxDepth+1,[],propConfig?{props:propConfig}:undefined);
}

/**
 * Internal implementation for deep optional conversion with recursion tracking
 * @param type - The Zod type to process
 * @param depth - Current recursion depth
 * @param converted - Array tracking converted types to prevent circular references
 * @param propConfig - Configuration for specific properties
 * @returns The converted Zod type
 */
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

/**
 * Type guard to check if a value is a ZodOptional type
 * @param value - The value to check
 * @returns True if the value is a ZodOptional
 */
export const valueIsZodOptional=(value:any):value is ZodOptional<any>=>{
    const name=getName(value);
    return name==='ZodOptional' || name==='optional';
}
/**
 * Type guard to check if a value is a ZodString type
 * @param value - The value to check
 * @returns True if the value is a ZodString
 */
export const valueIsZodString=(value:any):value is ZodString=>{
    const name=getName(value);
    return name==='ZodString' || name==='string';
}
/**
 * Type guard to check if a value is a ZodNumber type
 * @param value - The value to check
 * @returns True if the value is a ZodNumber
 */
export const valueIsZodNumber=(value:any):value is ZodNumber=>{
    const name=getName(value);
    return name==='ZodNumber' || name==='number';
}
/**
 * Type guard to check if a value is a ZodBoolean type
 * @param value - The value to check
 * @returns True if the value is a ZodBoolean
 */
export const valueIsZodBoolean=(value:any):value is ZodBoolean=>{
    const name=getName(value);
    return name==='ZodBoolean' || name==='boolean';
}
/**
 * Type guard to check if a value is a ZodNull type
 * @param value - The value to check
 * @returns True if the value is a ZodNull
 */
export const valueIsZodNull=(value:any):value is ZodNull=>{
    const name=getName(value);
    return name==='ZodNull' || name==='null';
}
/**
 * Type guard to check if a value is a ZodUndefined type
 * @param value - The value to check
 * @returns True if the value is a ZodUndefined
 */
export const valueIsZodUndefined=(value:any):value is ZodUndefined=>{
    const name=getName(value);
    return name==='ZodUndefined' || name==='undefined';
}
/**
 * Type guard to check if a value is a ZodLazy type
 * @param value - The value to check
 * @returns True if the value is a ZodLazy
 */
export const valueIsZodLazy=(value:any):value is ZodLazy<any>=>{
    const name=getName(value);
    return name==='ZodLazy' || name==='lazy';
}
/**
 * Type guard to check if a value is a ZodEnum type
 * @param value - The value to check
 * @returns True if the value is a ZodEnum
 */
export const valueIsZodEnum=(value:any):value is ZodEnum<any>=>{
    const name=getName(value);
    return name==='ZodEnum' || name==='enum';
}
/**
 * Type guard to check if a value is a ZodUnion type
 * @param value - The value to check
 * @returns True if the value is a ZodUnion
 */
export const valueIsZodUnion=(value:any):value is ZodUnion<any>=>{
    const name=getName(value);
    return name==='ZodUnion' || name==='union';
}
/**
 * Type guard to check if a value is a ZodLiteral type
 * @param value - The value to check
 * @returns True if the value is a ZodLiteral
 */
export const valueIsZodLiteral=(value:any):value is ZodLiteral<any>=>{
    const name=getName(value);
    return name==='ZodLiteral' || name==='literal';
}
/**
 * Type guard to check if a value is a ZodObject type
 * @param value - The value to check
 * @returns True if the value is a ZodObject
 */
export const valueIsZodObject=(value:any):value is ZodObject<any>=>{
    const name=getName(value);
    return name==='ZodObject' || name==='object';
}
/**
 * Type guard to check if a value is a ZodArray type
 * @param value - The value to check
 * @returns True if the value is a ZodArray
 */
export const valueIsZodArray=(value:any):value is ZodArray<any>=>{
    const name=getName(value);
    return name==='ZodArray' || name==='array';
}
/**
 * Type guard to check if a value is a ZodRecord type
 * @param value - The value to check
 * @returns True if the value is a ZodRecord
 */
export const valueIsZodRecord=(value:any):value is ZodRecord=>{
    const name=getName(value);
    return name==='ZodRecord' || name==='record';
}
/**
 * Type guard to check if a value is a ZodAny type
 * @param value - The value to check
 * @returns True if the value is a ZodAny
 */
export const valueIsZodAny=(value:any):value is ZodAny=>{
    const name=getName(value);
    return name==='ZodAny' || name==='any';
}
/**
 * Type guard to check if a value is a ZodNullable type
 * @param value - The value to check
 * @returns True if the value is a ZodNullable
 */
export const valueIsZodNullable=(value:any):value is ZodNullable<any>=>{
    const name=getName(value);
    return name==='ZodNullable' || name==='nullable';
}
/**
 * Type guard to check if a value is any ZodType
 * @param value - The value to check
 * @returns True if the value is a ZodType
 */
export const valueIsZodType=(value:any):value is ZodType<any>=>{
    return getName(value)?true:false;
}
