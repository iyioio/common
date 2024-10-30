
export interface AiCompletionInfo{
    fnName:string;
    anonUsdCap?:number;
    anonUsdCapTotal?:number;
}

export const aiCompletionCdkTemplate=(constructName:string,infos:AiCompletionInfo[])=>{

    return `import { Construct } from "constructs";
import { AiCompleteOpenAiConstruct, AiCompleteOpenAiConstructOptions } from "@convo-lang/ai-complete-openai-cdk";
import { ManagedProps, NodeFnProps } from "@iyio/cdk-common";

export interface ${constructName}Props
{
    managed?:ManagedProps;
    defaultFnProps?:NodeFnProps;
}

export class ${constructName} extends Construct
{

    public readonly instances:AiCompleteOpenAiConstruct[];

    public constructor(scope:Construct,name:string,{
        managed,
        defaultFnProps,
        ...props
    }:${constructName}Props={}){

        super(scope,name);

        this.instances=infos.map(options=>new AiCompleteOpenAiConstruct(this,name,{
            managed,
            grantAccess:true,
            defaultFnProps,
            ...options
        }));

    }

}

const infos:AiCompleteOpenAiConstructOptions[]=${JSON.stringify(infos,null,4)};

`
}

