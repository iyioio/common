import { pathExistsAsync } from "@iyio/node-common";
import { ProtoContext, ProtoPluginExecutionOptions } from "@iyio/protogen";
import { readFile, writeFile } from "fs/promises";

let cachedCtx:ProtoContext|null=null;

export const defaultProtogenContextPath='./.protogen-ctx.json';

export const loadProtoRuntimeCtxAsync=async ():Promise<ProtoContext>=>{
    if(cachedCtx){
        return cachedCtx;
    }

    const evnCtx=(
        process.env['NX_PROTOGEN_CONTEXT']??
        process.env['PROTOGEN_CONTEXT']
    )
    if(evnCtx?.trim()){
        cachedCtx=JSON.parse(evnCtx) as ProtoContext;
    }else{

        const path=(
            process.env['NX_PROTOGEN_CONTEXT_PATH']??
            process.env['PROTOGEN_CONTEXT_PATH']??
            defaultProtogenContextPath
        )

        if(!pathExistsAsync(path)){
            throw new Error(`ProtoContext not found at ${path}`);
        }

        const content=(await readFile(path)).toString();
        cachedCtx=JSON.parse(content) as ProtoContext;
    }

    cachedCtx.log=process.env['PROTOGEN_VERBOSE']?console.log:()=>{/* */}
    return cachedCtx;
}

export const saveProtoRuntimeCtxAsync=async (ctx:ProtoContext)=>{

    const json=JSON.stringify(ctx,null,4);


    const evnCtx=(
        process.env['NX_PROTOGEN_CONTEXT']??
        process.env['PROTOGEN_CONTEXT']
    )
    if(evnCtx){
        process.env['NX_PROTOGEN_CONTEXT']=json;
        process.env['PROTOGEN_CONTEXT']=json;
    }

    const path=(
        process.env['NX_PROTOGEN_CONTEXT_PATH']??
        process.env['PROTOGEN_CONTEXT_PATH']??
        defaultProtogenContextPath
    )

    await writeFile(path,json);

}

export const executeProtoPluginAsync=async (options?:ProtoPluginExecutionOptions)=>{
    const ctx=await loadProtoRuntimeCtxAsync();
    const pluginName=(
        process.env['PROTOGEN_CURRENT_PLUGIN']??
        process.env['NX_PROTOGEN_CURRENT_PLUGIN']
    )

    if(ctx.stage==='preprocess' && pluginName){
        ctx.metadata['plugin-'+pluginName]={
            preprocess:options?.preprocess?true:undefined,
            input:options?.input?true:undefined,
            parse:options?.parse?true:undefined,
            generate:options?.generate?true:undefined,
            output:options?.output?true:undefined,
        }
        await saveProtoRuntimeCtxAsync(ctx);
    }

    const callback=options?.[ctx.stage];
    if(callback){
        const result=await callback(ctx);
        if(result!==false){
            await saveProtoRuntimeCtxAsync(ctx);
        }
    }
}
