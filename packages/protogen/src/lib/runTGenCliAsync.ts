import { executeTGenPipelineAsync } from "./executeTGenPipelineAsync";
import { fileReader } from "./fileReader";
import { fileWriter } from "./fileWriter";
import { lucidCsvParser } from "./lucidCsvParser";
import { tgenCliFlags } from "./protogen-cli-const";
import { ProtoCallback, ProtoPipeline } from "./protogen-types";
import { zodGenerator } from "./zodGenerator";

export const runTGenCliAsync=async (argList:string[],argStart=0):Promise<ProtoPipeline>=>{

    const args:{[name:string]:string[]}={}

    for(let i=argStart;i<argList.length;i++){
        const a=argList[i];
        if(a.startsWith('-')){
            const v=argList[i+1]??'';
            let values=args[a];
            if(!values){
                values=[];
                args[a]=values;
            }
            if(v.startsWith('-')){
                values.push('');
            }else{
                values.push(v);
                i++;
            }
        }else{
            let values=args[tgenCliFlags.input];
            if(!values){
                values=[];
                args[tgenCliFlags.input]=values;
            }
            values.push(a);
        }
    }

    const verbose=args[tgenCliFlags.verbose]?true:false;
    const log=verbose?console.log:()=>{/* */}
    if(verbose){
        log('Verbose mode enabled');
    }

    const pipeline:ProtoPipeline={
        context:{
            args,
            inputArgs:args[tgenCliFlags.input]??[],
            outputArgs:args[tgenCliFlags.output]??[],
            sources:[],
            nodes:[],
            outputs:[],
            verbose,
            tab:'    ',
            log,
        },
        readers:[],
        parsers:[],
        generators:[],
        writers:[],
        plugins:{},
    };


    const plugins=args[tgenCliFlags.loadPlugin]??[];
    for(const p of plugins){

        log(`Load plugin module - ${p}`);

        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const mod=require(p);
        for(const name of mod){
            const callback=mod[name];
            if(typeof callback === 'function'){
                log(`Add plugin ${name} from ${p}`);
                pipeline.plugins[name]=callback;
            }
        }
    }

    const addToList=(flag:keyof typeof tgenCliFlags,ary:ProtoCallback[])=>{
        const names=args[tgenCliFlags[flag]]??[];
        for(const name of names){
            log(`Add ${flag} - ${name}`);
            const plugin=pipeline.plugins[name];
            if(!plugin){
                throw new Error(`No plugin found by name ${name}`)
            }
            ary.push(plugin);
        }
    }

    addToList('reader',pipeline.readers);
    addToList('parser',pipeline.parsers);
    addToList('generator',pipeline.generators);
    addToList('writer',pipeline.writers);


    if(!args[tgenCliFlags.noDefaultPlugins]?.length){

        if(!pipeline.readers.length){
            log('Add default reader - fileReader');
            pipeline.readers.push(fileReader);
        }

        if(!pipeline.parsers.length){
            log('Add default parser - lucidCsvParser');
            pipeline.parsers.push(lucidCsvParser);
        }

        if(!pipeline.generators.length){
            log('Add default generator - zodGenerator');
            pipeline.generators.push(zodGenerator);
        }

        if(!pipeline.writers.length){
            log('Add default writer - fileWriter');
            pipeline.writers.push(fileWriter);
        }
    }

    await executeTGenPipelineAsync(pipeline);

    //log('context',inspect(pipeline.context,{showHidden:false,depth:20,colors:true}));

    return pipeline;
}
