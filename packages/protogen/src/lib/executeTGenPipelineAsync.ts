import { ProtoCallback, ProtoPipeline } from "./protogen-types";

export const executeTGenPipelineAsync=async ({
    context,
    readers,
    parsers,
    generators,
    writers,
}:ProtoPipeline):Promise<void>=>{

    const log=context.log;

    const runPluginsAsync=async (type:keyof ProtoPipeline,ary:ProtoCallback[])=>{
        log(`Execute ${type}, count = ${ary.length}`);
        for(let i=0;i<ary.length;i++){
            const c=ary[i];
            log(`${i+1} of ${ary.length}`)
            await c(context);
        }
    }

    await runPluginsAsync('readers',readers);
    await runPluginsAsync('parsers',parsers);
    await runPluginsAsync('generators',generators);
    await runPluginsAsync('writers',writers);

}
