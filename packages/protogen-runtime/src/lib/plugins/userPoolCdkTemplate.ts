import type { UserPoolBuilderProps } from "@iyio/cdk-common";

export const userPoolCdkTemplate=(constructName:string,params:Omit<Partial<UserPoolBuilderProps>,'params'>)=>{


    return `import { Construct } from "constructs";
import { UserPoolBuilder, UserPoolBuilderProps } from "@iyio/cdk-common";

export interface ${constructName}Props extends UserPoolBuilderProps
{
    transform?:(props:${constructName}Props)=>${constructName}Props;
}

export class ${constructName} extends UserPoolBuilder
{

    public constructor(scope:Construct,name:string,props:${constructName}Props={}){

        super(scope,name,props.transform?props.transform({...getDefaults(),...props}):{...getDefaults(),...props});

    }

}

const getDefaults=():Omit<Partial<UserPoolBuilderProps>,'params'>=>(${JSON.stringify(params,null,4)});
`
}

