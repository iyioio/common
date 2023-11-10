import { aiCompleteConvoModule } from '@iyio/ai-complete';
import { openAiModule } from '@iyio/ai-complete-openai';
import { EnvParams, initRootScope, rootScope } from "@iyio/common";
import { Conversation, parseConvoCode } from "@iyio/convo-lang";
import { nodeCommonModule, pathExistsAsync, readFileAsJsonAsync, readFileAsStringAsync } from "@iyio/node-common";
import { writeFile } from "fs/promises";
import { homedir } from 'node:os';
import { ConvoCliConfig, ConvoLangCliOptions } from "./convo-cli-types";

let configPromise:Promise<ConvoCliConfig>|null=null;
const getConfigAsync=(options:ConvoLangCliOptions):Promise<ConvoCliConfig>=>
{
    return configPromise??(configPromise=_getConfigAsync(options));
}

const _getConfigAsync=async (options:ConvoLangCliOptions):Promise<ConvoCliConfig>=>
{
    let configPath=options.config??'~/.config/convo/convo.json';

    if(configPath.startsWith('~')){
        configPath=homedir()+configPath.substring(1);
    }

    const configExists=await pathExistsAsync(configPath);
    if(!configExists && options.config!==undefined){
        throw new Error(`Convo config file not found a path - ${configPath}`)
    }
    return await readFileAsJsonAsync(configPath);
}

let initPromise:Promise<void>|null=null;
const initAsync=(options:ConvoLangCliOptions):Promise<void>=>
{
    return initPromise??(initPromise=_initAsync(options));
}

const _initAsync=async (options:ConvoLangCliOptions):Promise<void>=>
{

    const config=await getConfigAsync(options);

    initRootScope(reg=>{
        if(config.env){
            reg.addParams(config.env);
        }
        reg.addParams(new EnvParams());
        reg.use(nodeCommonModule);
        reg.use(openAiModule);
        reg.use(aiCompleteConvoModule);
    })
    await rootScope.getInitPromise();
}

export class ConvoLangCli
{

    public readonly options:ConvoLangCliOptions;

    public readonly buffer:string[]=[];

    public constructor(options:ConvoLangCliOptions){
        this.options=options;
    }

    private out(...chunks:string[]){
        if(this.options.out || this.options.bufferOutput){
            if(typeof this.options.out==='function'){
                this.options.out(...chunks);
            }else{
                this.buffer.push(...chunks);
            }
        }else{
            if(globalThis?.process?.stdout){
                for(let i=0;i<chunks.length;i++){
                    globalThis.process.stdout.write(chunks[i]??'')
                }
            }else{
                console.log(...chunks);
            }
        }
    }



    public async executeAsync():Promise<void>
    {
        await initAsync(this.options);

        if(this.options.inline){
            if(this.options.parse){
                this.parseCode(this.options.inline);
            }else{
                await this.executeSourceCode(this.options.inline);
            }
            this.writeOutputAsync();
        }else if(this.options.source){
            const source=await readFileAsStringAsync(this.options.source);
            if(this.options.parse){
                this.parseCode(source);
            }else{
                await this.executeSourceCode(source);
            }
            this.writeOutputAsync();
        }
    }

    private async executeSourceCode(code:string):Promise<void>{

        const convo=new Conversation();
        convo.append(code);
        const r=await convo.completeAsync();
        if(r.error){
            throw r.error;
        }
        this.out(convo.convo);
    }

    private parseCode(code:string){
        const r=parseConvoCode(code);
        if(r.error){
            throw r.error;
        }
        this.out(JSON.stringify(r.result,null,this.options.parseFormat));
    }

    private async writeOutputAsync()
    {
        let out=this.options.out;
        if(out==='.'){
            out=this.options.source;
        }
        if(typeof out !== 'string'){
            return;
        }
        await writeFile(out,this.buffer.join(''));
    }
}
