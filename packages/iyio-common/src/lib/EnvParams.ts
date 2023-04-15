import { nameToEnvName } from "./common-lib";
import { ParamProvider } from "./scope-types";

export class EnvParams implements ParamProvider
{

    public readonly autoPrefix?:string;

    public constructor(autoPrefix='NX_')
    {
        this.autoPrefix=autoPrefix;
    }

    public getParam(name:string):string|undefined{
        const env=(globalThis as any).process?.env;
        const envName=nameToEnvName(name);
        const value=env?.[name] ?? env?.[envName];
        if(value!==undefined){
            return value;
        }
        if(this.autoPrefix){
            return env?.[this.autoPrefix+name] ?? env?.[this.autoPrefix+envName];
        }else{
            return undefined;
        }
    }
}
