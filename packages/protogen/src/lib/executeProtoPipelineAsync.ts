import { protoParseConfig } from "./protogen-pipeline";
import { ProtoContext, ProtoPipeline, ProtoPipelineConfigurablePlugin, ProtoPipelinePlugin, ProtoStage } from "./protogen-pipeline-types";

const getConfig=(ctx:ProtoContext,plugin:ProtoPipelinePlugin):any=>{
    const configScheme=(plugin as ProtoPipelineConfigurablePlugin<any,any>).configScheme;
    return configScheme?protoParseConfig(configScheme,ctx.args):null
}

export const executeTGenPipelineAsync=async ({
    context,
    plugins,
    config
}:ProtoPipeline):Promise<void>=>{

    const log=context.log;

    log(`\n--------------------------\nStart pipeline${config.dryRun?' ( DRY RUN )':''} - ${context.executionId}}`);

    const runPluginsAsync=async (stage:ProtoStage)=>{
        context.stage=stage;
        log(`\n## Stage ${stage}`);

        for(const info of plugins){
            const plugin=info.plugin;
            if(plugin.beforeEach){
                log(`beforeEach ${info.source}:${info.name}`);
                await plugin.beforeEach(context,getConfig(context,plugin),info);
            }
            if(plugin[stage]){
                log(`${stage} ${info.source}:${info.name}`);
                await plugin[stage]?.(context,getConfig(context,plugin),info);
            }
            if(plugin.afterEach){
                log(`afterEach ${info.source}:${info.name}`);
                await plugin.afterEach(context,getConfig(context,plugin),info);
            }
        }
    }

    log("\n## Plugins");
    for(const info of plugins){
        log(`plugin ${info.source}:${info.name}`);
    }

    for(const info of plugins){
        if(info.plugin.beforeAll){
            log(`beforeAll ${info.source}:${info.name}`)
            await info.plugin.beforeAll(context,getConfig(context,info.plugin),info);
        }
    }

    await runPluginsAsync('init');
    await runPluginsAsync('input');
    await runPluginsAsync('preprocess');
    await runPluginsAsync('parse');
    await runPluginsAsync('generate');
    await runPluginsAsync('output');


    for(const info of plugins){
        if(info.plugin.afterAll){
            log(`afterAll ${info.source}:${info.name}`)
            await info.plugin.afterAll(context,getConfig(context,info.plugin),info);
        }
    }

    if(config.logImportMap){
        log(`\nimportMap:${JSON.stringify(context.importMap,null,4)}`);
    }

    log(`\nEnd pipeline${config.dryRun?' ( DRY RUN )':''} - ${context.executionId}\n--------------------------\n`)

}
