import { ProtoCallback, ProtoPipeline, ProtoStage } from "./protogen-types";

export const executeTGenPipelineAsync=async ({
    context,
    readers,
    parsers,
    generators,
    writers,
    externalExecutors,
    externalPlugins,
}:ProtoPipeline):Promise<void>=>{

    const log=context.log;

    log(`Start pipeline - ${context.executionId}}`)

    const runPluginsAsync=async (stage:ProtoStage,type:(keyof ProtoPipeline)|'preProcessors',ary:ProtoCallback[])=>{
        context.stage=stage;
        log(`Stage ${stage}, ${ary.length} ${type}`);
        for(let i=0;i<ary.length;i++){
            const plugin=ary[i];
            log(`${i+1} of ${ary.length} - ${typeof plugin === 'function'?'function':plugin}`);
            await plugin(context);
        }

        for(const plugin of externalPlugins){

            let executed=false;

            log(`exec ${stage} - ${plugin}`);

            for(const exe of externalExecutors){
                if(await exe(context,{action:'run-plugin',plugin})){
                    executed=true;
                    break;
                }
            }

            if(!executed){
                throw new Error(`Can not executed ${plugin}. No external executor defined`);
            }

        }
    }

    await runPluginsAsync('preprocess','preProcessors',[]);
    await runPluginsAsync('input','readers',readers);
    await runPluginsAsync('parse','parsers',parsers);
    await runPluginsAsync('generate','generators',generators);
    await runPluginsAsync('output','writers',writers);


    for(const exe of externalExecutors){
        await exe(context,{action:'clean-up'});
    }

    log(`end of pipeline - ${context.executionId}`)

}
