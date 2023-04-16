import { HashMap, uuid } from "@iyio/common";
import { defaultProtoLibStyle, executeTGenPipelineAsync, protoGetStageFromName, ProtoPipeline, ProtoPipelineConfig } from "@iyio/protogen";
import { getDefaultProtoPipelinePlugins } from "./default-plugins";

export interface RunProtogenCliAsyncOptions
{
    config:ProtoPipelineConfig;
    args:HashMap<any>;
    loadModule?:(name:string)=>any;
    logOutput?:(...args:any[])=>void;
    verbose?:boolean;
    onOutputReady?:(verbose:boolean,logOutput:(...args:any[])=>void)=>void;
    onPipelineReady?:(pipeline:ProtoPipeline)=>void;
}

export const runProtogenCliAsync=async ({
    config,
    args,
    loadModule,
    logOutput,
    verbose: _verbose,
    onOutputReady,
    onPipelineReady,
}:RunProtogenCliAsyncOptions):Promise<ProtoPipeline>=>{

    let startDir:string|null=null;
    if(config.workingDirectory && globalThis.process?.chdir!==undefined && globalThis.process?.cwd!==undefined){
        startDir=globalThis.process.cwd();
        globalThis.process.chdir(config.workingDirectory);
    }

    try{

        const verbose=_verbose??config.verbose??false;
        const log=logOutput??(verbose?console.log:()=>{/* */})
        onOutputReady?.(verbose,log);
        if(verbose){
            log('Verbose mode enabled');
        }

        const pipeline:ProtoPipeline={
            config,
            context:{
                executionId:uuid(),
                metadata:{},
                packagePaths:{},
                args,
                inputs:config.inputs??[],
                sources:[],
                nodes:[],
                outputs:[],
                verbose,
                namespace:config.namespace??'common',
                tab:'    ',
                stage:'init',
                importMap:{},
                dryRun:config.dryRun??false,
                libStyle:config.libStyle??defaultProtoLibStyle,
                autoIndexPackages:config.libStyle==='nx',
                log,
            },
            plugins:[],
        };


        const plugins=config.plugins??[];
        for(const p of plugins){

            const [source,_name,...paths]=p.split(':');
            const name=_name||'default';

            log(`Load plugin ${name} from ${source}`);

            const plugin=loadModule?.(p)?.[name];
            if(!plugin){
                throw new Error(`No plugin found for plugin path ${p}`)
            }
            if(typeof plugin === 'function'){
                const stage=protoGetStageFromName(name)??protoGetStageFromName(source);
                if(!stage){
                    throw new Error('Unable to determine plugin stage by name')
                }
                pipeline.plugins.push({
                    name,
                    source,
                    paths,
                    plugin:{[stage]:plugin}
                })

            }else if(typeof plugin === 'object'){
                pipeline.plugins.push({
                    name,
                    source,
                    paths,
                    plugin
                })
            }else{
                throw new Error(
                    `Invalid plugin returned from ${p}. `+
                    `A ProtoPipelinePlugin, ProtoPipelineConfigurablePlugin or `+
                    `function should be returned.`
                )
            }
        }


        if(config.loadDefaultPlugins){

            pipeline.plugins.push(...getDefaultProtoPipelinePlugins());
        }

        if(config.disablePlugins){
            for(let i=0;i<pipeline.plugins.length;i++){
                const p=pipeline.plugins[i];
                if(config.disablePlugins.includes(p.name)){
                    log(`disabling plugin ${p.name}`);
                    pipeline.plugins.splice(i,1);
                    i--;
                }
            }
        }

        onPipelineReady?.(pipeline);

        await executeTGenPipelineAsync(pipeline);

        //log('context',inspect(pipeline.context,{showHidden:false,depth:20,colors:true}));

        return pipeline;
    }finally{
        if(startDir){
            globalThis.process.chdir(startDir);
        }
    }
}
