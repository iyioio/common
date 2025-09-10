import { ZodType, z } from "zod";
import { getZodTypeName, unwrapZodType, valueIsZodAny, valueIsZodArray, valueIsZodBoolean, valueIsZodEnum, valueIsZodLazy, valueIsZodLiteral, valueIsZodNull, valueIsZodNullable, valueIsZodNumber, valueIsZodObject, valueIsZodRecord, valueIsZodString, valueIsZodType, valueIsZodUndefined, valueIsZodUnion } from "./zod-helpers.js";

describe('code-parsing',()=>{

    it('should check zod types',()=>{

        const checkType=(name:string,checker:(value:any)=>boolean,type:ZodType,unwrappedChecker?:(value:any)=>boolean)=>{
            const opType=type.optional().nullable();
            if(!checker(type)){
                throw new Error(`${name} check failed`);
            }

            if(!(unwrappedChecker??checker)(unwrapZodType(type.optional().nullable()))){
                throw new Error(`Optional ${name} check failed. Found ${
                    getZodTypeName(type.optional().nullable())
                } / ${getZodTypeName(unwrapZodType(type.optional().nullable()))}`);

            }
        }

        checkType('string',valueIsZodString,z.string());
        checkType('number',valueIsZodNumber,z.number());
        checkType('boolean',valueIsZodBoolean,z.boolean());
        checkType('null',valueIsZodNull,z.null());
        checkType('undefined',valueIsZodUndefined,z.undefined());
        checkType('lazy',valueIsZodLazy,z.lazy(()=>z.object({a:z.string()})),valueIsZodObject);
        checkType('enum',valueIsZodEnum,z.enum(['a','b']));
        checkType('union',valueIsZodUnion,z.union([z.string(),z.number()]));
        checkType('literal',valueIsZodLiteral,z.literal(77));
        checkType('object',valueIsZodObject,z.object({b:z.number()}));
        checkType('array',valueIsZodArray,z.array(z.any()));
        checkType('record',valueIsZodRecord,z.record(z.any()));
        checkType('any',valueIsZodAny,z.any());
        checkType('nullable',valueIsZodNullable,z.nullable(z.string()),valueIsZodString);
        checkType('type - number',valueIsZodType,z.number());
        checkType('type - string',valueIsZodType,z.string());



    })

});
