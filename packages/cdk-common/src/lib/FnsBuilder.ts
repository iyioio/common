import { ParamTypeDef } from "@iyio/common";
import { Construct } from "constructs";
import { AccessGranter, AccessRequest, IAccessGrantGroup, IAccessRequestGroup } from "./common-cdk-types";
import { NodeFn, NodeFnProps } from "./NodeFn";
import { ParamOutput } from "./ParamOutput";

export interface FnInfoAndNodeFn
{
    info:FnInfo;
    fn:NodeFn;
}

export interface FnInfo
{
    name:string;
    createProps:NodeFnProps;
    arnParam?:ParamTypeDef<string>;
    grantAccess?:boolean;
    accessRequests?:Omit<AccessRequest,'grantee'>[];
}

export interface FnsBuilderProps
{
    fnsInfo:FnInfo[];
    params?:ParamOutput;
}

export class FnsBuilder extends Construct implements IAccessGrantGroup, IAccessRequestGroup
{

    public readonly fns:FnInfoAndNodeFn[];

    public readonly accessGrants:AccessGranter[]=[];

    public readonly accessRequests:AccessRequest[]=[];


    public constructor(scope:Construct,name:string,{
        fnsInfo,
        params,
    }:FnsBuilderProps){

        super(scope,name);

        const fns:FnInfoAndNodeFn[]=[];

        for(const info of fnsInfo){

            const fn:FnInfoAndNodeFn={
                info,
                fn:new NodeFn(this,info.name,info.createProps),
            }

            if(info.arnParam && params){
                params.setParam(info.arnParam,fn.fn.func.functionArn);
            }

            if(info.grantAccess){
                this.accessGrants.push({
                    grantName:info.name,
                    grant:request=>{
                        if(request.types?.includes('invoke')){
                            fn.fn.func.grantInvoke(request.grantee);
                            if(fn.fn.url){
                                fn.fn.func.grantInvokeUrl(request.grantee);
                            }
                        }
                    }
                })
            }

            if(info.accessRequests){
                this.accessRequests.push(...info.accessRequests.map(i=>({...i,grantee:fn.fn.func})));
            }

            fns.push(fn);
        }

        this.fns=fns;

    }

}
