import { HashMap, uuid } from "@iyio/common";
import { ProtoPipeline, ProtoPipelineConfig, defaultProtoLibStyle, executeTGenPipelineAsync, protoGetStageFromName } from "@iyio/protogen";
import { getDefaultProtoPipelinePlugins } from "./default-plugins.js";

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

        const namespace=config.namespace??'common';
        const paramPackageName=config.paramPackageName??'params';

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
                writtenOutputs:[],
                autoDeletePaths:[],
                generationStage:0,
                dataOutputs:{},
                verbose,
                namespace,
                tab:'    ',
                stage:'init',
                importMap:{},
                dryRun:config.dryRun??false,
                libStyle:config.libStyle??defaultProtoLibStyle,
                autoIndexPackages:config.libStyle==='nx',
                callables:[],
                requiredFeatures:new Set<string>(),
                paramMap:{},
                paramPackage:`@${namespace}/${paramPackageName}`,
                paramPackageName:paramPackageName,
                cdkProjectDir:config.cdkProjectDir??'packages/cdk',
                log,
            },
            plugins:[],
        };


        const plugins=config.plugins??[];
        for(const p of plugins){

            if(typeof p === 'object'){
                pipeline.plugins.push(p);
                continue;
            }

            const [_order,source,_name,...paths]=p.split(':');
            const order=Number(_order);
            if(!isFinite(order)){
                throw new Error('order is not a number');
            }
            if(source===undefined){
                continue;
            }
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
                    order,
                    name,
                    source,
                    paths,
                    plugin:{[stage]:plugin}
                })

            }else if(typeof plugin === 'object'){
                pipeline.plugins.push({
                    order,
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
                if(!p){
                    continue;
                }
                if(config.disablePlugins.includes(p.name)){
                    log(`disabling plugin ${p.name}`);
                    pipeline.plugins.splice(i,1);
                    i--;
                }
            }
        }

        pipeline.plugins.sort((a,b)=>a.order-b.order)

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
