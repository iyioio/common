import { ZodBoolean, ZodError, ZodNull, ZodNumber, ZodOptional, ZodString, ZodTypeAny, ZodUndefined } from "zod";
import { TsPrimitiveType } from "./typescript-types";

export const getZodErrorMessage=(zodError:ZodError):string=>{
    return zodError.message;
}

export const zodTypeToPrimitiveType=(type:ZodTypeAny):TsPrimitiveType|undefined=>{

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
    }else{
        return undefined;
    }
}
