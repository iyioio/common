
export interface AiCompletionInfo{
    fnName:string;
}

export const aiCompletionCdkTemplate=(constructName:string,infos:AiCompletionInfo[])=>{

    const names=infos.map(n=>n.fnName);

    return `import { Construct } from "constructs";
import { AiCompleteOpenAiConstruct } from "@iyio/ai-complete-openai-cdk";
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

        this.instances=names.map(name=>new AiCompleteOpenAiConstruct(this,name,{
            managed,
            grantAccess:true,
            fnName:name,
            defaultFnProps
        }));

    }

}

const names=${JSON.stringify(names,null,4)};

`
}

