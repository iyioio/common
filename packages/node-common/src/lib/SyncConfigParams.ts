import { ParamProvider, strToUpperSnakeCase } from "@iyio/common";
import { readFileSync } from "fs";

export class SyncConfigParams implements ParamProvider
{

    private configValues:Record<string,string>|undefined;

    private configPath:string|undefined;

    public configPathSetByEnv:boolean=false;

    public constructor(configPath?:string){
        if(!configPath){
            configPath=globalThis.process?.env['IYIO_CONFIG_JSON_PATH'];
            if(configPath){
                this.configPathSetByEnv=true;
            }
        }
        this.configPath=configPath;
    }

    private getValues(){
        if(!this.configValues){
            if(!this.configPath){
                return undefined;
            }
            const json=readFileSync(this.configPath).toString();
            this.configValues=JSON.parse(json);
        }
        return this.configValues;
    }

    public getParam(name:string):string|undefined{



        return this.getValues()?.[name];
    }

    public populateEnv(onlyIfPathSetByEnv:boolean){
        if((onlyIfPathSetByEnv && !this.configPathSetByEnv) || !globalThis.process?.env){
            return this;
        }
        const values=this.getValues();
        if(!values){
            return this;
        }
        for(const e in values){
            const name=strToUpperSnakeCase(e);
            if(globalThis.process.env[name]===undefined){
                globalThis.process.env[name]=values[e];
            }
        }
        return this;
    }
}
