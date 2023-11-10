import { aiCompleteConvoModule } from '@iyio/ai-complete';
import { openAiModule } from '@iyio/ai-complete-openai';
import { EnvParams, initRootScope, rootScope } from "@iyio/common";
import { Conversation, parseConvoCode } from "@iyio/convo-lang";
import { nodeCommonModule, pathExistsAsync, readFileAsJsonAsync, readFileAsStringAsync } from "@iyio/node-common";
import { writeFile } from "fs/promises";
import { homedir } from 'node:os';
import { ConvoCliConfig, ConvoLangCliOptions } from "./convo-cli-types";



export class ConvoLangCli
{

    public readonly options:ConvoLangCliOptions;

    private readonly outChunks:string[]=[]

    public constructor(options:ConvoLangCliOptions){
        this.options=options;
    }

    private out(...chunks:string[]){
        if(this.options.out){
            if(typeof this.options.out==='function'){
                this.options.out(...chunks);
            }else{
                this.outChunks.push(...chunks);
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

    private configPromise:Promise<ConvoCliConfig>|null=null;
    public getConfigAsync():Promise<ConvoCliConfig>
    {
        return this.configPromise??(this.configPromise=this._getConfigAsync());
    }

    private async _getConfigAsync():Promise<ConvoCliConfig>{
        let configPath=this.options.config??'~/.config/convo/convo.json';

        if(configPath.startsWith('~')){
            configPath=homedir()+configPath.substring(1);
        }

        const configExists=await pathExistsAsync(configPath);
        if(!configExists && this.options.config!==undefined){
            throw new Error(`Convo config file not found a path - ${configPath}`)
        }
        return await readFileAsJsonAsync(configPath);
    }

    private initPromise:Promise<void>|null=null;
    public initAsync():Promise<void>
    {
        return this.initPromise??(this.initPromise=this._initAsync());
    }

    private async _initAsync():Promise<void>
    {

        const config=await this.getConfigAsync();

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

    public async executeAsync():Promise<void>
    {
        await this.initAsync();

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
        await writeFile(out,this.outChunks.join(''));
    }
}
