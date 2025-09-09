import { HashMap, valueIsZodObject } from "@iyio/common";
import { ZodSchema, ZodType } from "zod";
import { ProtoStage } from "./protogen-pipeline-types";

export const protoGetStageFromName=(name:string):ProtoStage|null=>{
    const match=/(\w+)(\.\w?)?$/.exec(name);
    if(match){
        name=match[1]??'';
    }

    name=name.toLowerCase();

    if(name.endsWith('init') || name.endsWith('initializer')){
        return 'init';;
    }else if(name.endsWith('reader') || name.endsWith('read') || name.endsWith('input')){
        return 'input';
    }else if(name.endsWith('preprocessor') || name.endsWith('preprocess')){
        return 'preprocess';
    }else if(name.endsWith('parser') || name.endsWith('parse')){
        return 'parse';
    }else if(name.endsWith('generator') || name.endsWith('generate')){
        return 'generate';
    }else if(name.endsWith('writer') || name.endsWith('write') || name.endsWith('output')){
        return 'output';
    }else{
        return null;
    }
}

export const protoParseConfig=(configScheme:ZodSchema,args:HashMap<any>):any=>{
    if(!(valueIsZodObject(configScheme))){
        return {}
    }

    const config:HashMap<any>={};

    const shape=configScheme.shape;
    for(const e in shape){
        let value=args[e];
        if(value===undefined){
            continue;
        }

        const prop:ZodType=shape[e];
        const parsed=prop.safeParse(value)
        if(parsed.success){
            config[e]=parsed.data;
        }else if(parsed.success===false){
            let fixed=false;
            if(Array.isArray(value) && value.length && value.every(s=>typeof s === 'string')){
                for(const issue of parsed.error.issues){
                    if(issue.code==='invalid_type'){
                        value=value.join(' ');
                        fixed=true;
                        switch(issue.expected){

                            case "float":
                            case "integer":
                            case 'number':
                                value=Number(value);
                                break;

                            case "boolean":
                                value=Boolean(value);
                                break;

                            case 'string':
                                break;

                            default:
                                fixed=false;
                                break;


                        }
                        if(fixed){
                            const p=prop.safeParse(value);
                            if(p.success){
                                config[e]=p.data;
                            }else{
                                fixed=false;
                            }
                        }
                    }
                }
            }
            if(!fixed){
                throw new Error('Unable to convert value.\n'+parsed.error.flatten().formErrors.join('\n'));
            }
        }
    }

    return config;

}
