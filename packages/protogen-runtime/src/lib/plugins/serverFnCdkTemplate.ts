import type { NodeFnProps } from "@iyio/cdk-common";
import { ProtoNode, protoRemoveDisplayChildren } from "@iyio/protogen";

export interface ServerFnInfo
{
    name:string;
    node:ProtoNode;
    createProps:NodeFnProps;
}

export const serverFnCdkTemplate=(infos:ServerFnInfo[])=>{

    infos=infos.map(i=>({
        ...i,
        node:protoRemoveDisplayChildren(i.node),
    }))


    return `import { ProtoNode } from "@iyio/protogen";
import { Construct } from "constructs";
import { NodeFn, NodeFnProps } from "@iyio/cdk-common";

export interface NodeServerFn
{
    info:ServerFnInfo;
    fn:NodeFn;
}

export interface ServerFnInfo
{
    name:string;
    node:ProtoNode;
    createProps:NodeFnProps;
}

export interface ServerFnsProps
{
    forAllFns?:(fnInfos:ServerFnInfo[])=>void;
    beforeEach?:(fnInfo:ServerFnInfo)=>void|boolean;
    afterEach?:(fn:NodeServerFn)=>void;
}

export class ServerFns extends Construct
{

    public readonly fns:NodeServerFn[];

    public constructor(scope:Construct,name:string,{
        forAllFns,
        beforeEach,
        afterEach,
    }:ServerFnsProps={}){

        super(scope,name);

        const fns:NodeServerFn[]=[];
        this.fns=fns;

        forAllFns?.(this.fnInfos);

        for(const info of this.fnInfos){

            if(beforeEach?.(info)===false){
                continue;
            }

            const fn:NodeServerFn={
                info,
                fn:new NodeFn(this,info.name,info.createProps),
            }

            afterEach?.(fn);
            fns.push(fn);
        }

    }

    public readonly fnInfos:ServerFnInfo[]=${JSON.stringify(infos,null,4)};

}
`
}
