import type { NodeFnProps } from "@iyio/cdk-common";

export interface ServerFnInfo
{
    name:string;
    createProps:NodeFnProps;
}

export const serverFnCdkTemplate=(constructName:string,infos:ServerFnInfo[])=>{


    return `import { Construct } from "constructs";
import { NodeFn, NodeFnProps } from "@iyio/cdk-common";

export interface ServerFnInfoAndNodeFn
{
    info:ServerFnInfo;
    fn:NodeFn;
}

export interface ServerFnInfo
{
    name:string;
    createProps:NodeFnProps;
}

export interface ServerFnsProps
{
    transformFns?:(fnInfos:ServerFnInfo[])=>ServerFnInfo[];
}

export class ${constructName} extends Construct
{

    public readonly fns:ServerFnInfoAndNodeFn[];

    public constructor(scope:Construct,name:string,{
        transformFns,
    }:ServerFnsProps={}){

        super(scope,name);

        const fns:ServerFnInfoAndNodeFn[]=[];
        this.fns=fns;

        if(transformFns){
            this.fnInfos=transformFns(this.fnInfos);
        }

        for(const info of this.fnInfos){

            const fn:ServerFnInfoAndNodeFn={
                info,
                fn:new NodeFn(this,info.name,info.createProps),
            }
            fns.push(fn);
        }

    }

    public readonly fnInfos:ServerFnInfo[]=${JSON.stringify(infos,null,4)};

}
`
}
