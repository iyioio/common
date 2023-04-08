import { HashMap, uuid } from "@iyio/common";
import { executeTGenPipelineAsync, protoGetStageFromName, ProtoPipeline, ProtoPipelineConfig } from "@iyio/protogen";
import { fileReader } from "./fileReader";
import { fileWriter } from "./fileWriter";
import { lucidCsvParser } from "./lucidCsvParser";
import { markdownParser } from "./markdownParser";
import { reactPlugin } from "./reactPlugin";
import { zodPlugin } from "./zodPlugin";

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
                args,
                inputs:config.inputs??[],
                sources:[],
                nodes:[],
                outputs:[],
                verbose,
                tab:'    ',
                stage:'init',
                importMap:{},
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

            pipeline.plugins.push({
                name:'fileReader',
                source:'@',
                paths:[],
                plugin:{
                    input:fileReader
                }
            });

            pipeline.plugins.push({
                name:'markdownParser',
                source:'@',
                paths:[],
                plugin:{
                    parse:markdownParser
                }
            });

            pipeline.plugins.push({
                name:'lucidCsvParser',
                source:'@',
                paths:[],
                plugin:{
                    parse:lucidCsvParser
                }
            });

            pipeline.plugins.push({
                name:'zodPlugin',
                source:'@',
                paths:[],
                plugin:zodPlugin
            });

            pipeline.plugins.push({
                name:'reactPlugin',
                source:'@',
                paths:[],
                plugin:reactPlugin
            });

            pipeline.plugins.push({
                name:'fileWriter',
                source:'@',
                paths:[],
                plugin:{
                    output:fileWriter
                }
            });
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
