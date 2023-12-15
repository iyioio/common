import { aiCompleteConvoModule } from '@iyio/ai-complete';
import { openAiModule } from '@iyio/ai-complete-openai';
import { EnvParams, initRootScope, rootScope } from "@iyio/common";
import { Conversation, convoVars, createConversationFromScope, parseConvoCode } from "@iyio/convo-lang";
import { nodeCommonModule, pathExistsAsync, readFileAsJsonAsync, readFileAsStringAsync, readStdInLineAsync } from "@iyio/node-common";
import { writeFile } from "fs/promises";
import { homedir } from 'node:os';
import { ConvoCliConfig, ConvoCliOptions, ConvoExecAllowMode, ConvoExecConfirmCallback } from "./convo-cli-types";
import { createConvoExec } from './convo-exec';

let configPromise:Promise<ConvoCliConfig>|null=null;
export const getConvoCliConfigAsync=(options:ConvoCliOptions):Promise<ConvoCliConfig>=>
{
    return configPromise??(configPromise=_getConfigAsync(options));
}

const _getConfigAsync=async (options:ConvoCliOptions):Promise<ConvoCliConfig>=>
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

let initPromise:Promise<ConvoCliOptions>|null=null;
export const initConvoCliAsync=(options:ConvoCliOptions):Promise<ConvoCliOptions>=>
{
    return initPromise??(initPromise=_initAsync(options));
}

const _initAsync=async (options:ConvoCliOptions):Promise<ConvoCliOptions>=>
{

    const config=await getConvoCliConfigAsync(options);

    initRootScope(reg=>{
        if(config.env && !config.overrideEnv){
            reg.addParams(config.env);
        }
        reg.addParams(new EnvParams());
        if(config.env && config.overrideEnv){
            reg.addParams(config.env);
        }
        reg.use(nodeCommonModule);
        reg.use(openAiModule);
        reg.use(aiCompleteConvoModule);
    })
    await rootScope.getInitPromise();
    return config;
}

/**
 * Initializes the ConvoCli environment the returns a new ConvoCli object
 */
export const createConvoCliAsync=async (options:ConvoCliOptions):Promise<ConvoCli>=>{
    await initConvoCliAsync(options);
    return new ConvoCli(options);
}

export class ConvoCli
{

    public readonly options:ConvoCliOptions;

    public readonly buffer:string[]=[];

    public readonly convo:Conversation;

    public allowExec?:ConvoExecAllowMode|ConvoExecConfirmCallback;

    public constructor(options:ConvoCliOptions){
        this.allowExec=options.allowExec;
        this.options=options;
        this.convo=createConversationFromScope(rootScope,{capabilities:['vision']});
        if(options.prepend){
            this.convo.append(options.prepend);
        }
        if(this.options.exeCwd){
            this.convo.unregisteredVars[convoVars.__cwd]=this.options.exeCwd;
        }
    }

    private _isDisposed=false;
    public get isDisposed(){return this._isDisposed}
    public dispose()
    {
        if(this._isDisposed){
            return;
        }
        this._isDisposed=true;
        this.convo.dispose();
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
        const config=await initConvoCliAsync(this.options);
        if(!this.allowExec){
            this.allowExec=config.allowExec??'ask';
        }

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

    private readonly execConfirmAsync=async (command:string):Promise<boolean>=>{
        if(this.allowExec==='allow'){
            return true;
        }else if(this.allowExec==='ask'){
            process.stdout.write(`Exec command requested\n> ${command}\nAllow y/N?\n`);
            const line=(await readStdInLineAsync()).toLowerCase();
            return line==='yes' || line==='y';
        }else{
            return false;
        }
    }

    private async executeSourceCode(code:string):Promise<void>{

        this.convo.defineFunction({
            name:'exec',
            registerOnly:true,
            scopeCallback:createConvoExec(typeof this.allowExec==='function'?
                this.allowExec:this.execConfirmAsync
            )
        })
        this.convo.append(code);
        const r=await this.convo.completeAsync();
        if(r.error){
            throw r.error;
        }
        this.out(this.convo.convo);
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
