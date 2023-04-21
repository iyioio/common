import type { SiteInfo } from "@iyio/cdk-common";


export const siteCdkTemplate=(constructName:string,sites:SiteInfo[])=>{

    return `import { Construct } from "constructs";
import { SiteBuilder, SiteInfo, ManagedProps } from "@iyio/cdk-common";

export interface ${constructName}Props
{
    managed?:ManagedProps;
    transform?:(sites:SiteInfo[])=>SiteInfo[];
}

export class ${constructName} extends SiteBuilder
{

    public constructor(scope:Construct,name:string,props:${constructName}Props={}){

        super(scope,name,{
            managed:props.managed,
            sites:props.transform?props.transform(getSites()):getSites()
        });

    }

}

const getSites=():SiteInfo[]=>${JSON.stringify(sites,null,4)}`
}

