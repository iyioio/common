import { ParamTypeDef } from "@iyio/common";
import { Construct } from "constructs";
import { ManagedProps } from "./ManagedProps";
import { NodeFn, NodeFnProps } from "./NodeFn";
import { AccessGranter, AccessRequest, AccessRequestDescription, IAccessGrantGroup, IAccessRequestGroup } from "./cdk-types";

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
    accessRequests?:AccessRequestDescription[],
}

export interface FnsBuilderProps
{
    fnsInfo:FnInfo[];
    managed?:ManagedProps;
}

export class FnsBuilder extends Construct implements IAccessGrantGroup, IAccessRequestGroup
{

    public readonly fns:FnInfoAndNodeFn[];

    public readonly accessGrants:AccessGranter[]=[];

    public readonly accessRequests:AccessRequest[]=[];


    public constructor(scope:Construct,name:string,{
        fnsInfo,
        managed:{
            params,
            accessManager
        }={},
    }:FnsBuilderProps){

        super(scope,name);

        const fns:FnInfoAndNodeFn[]=[];

        for(const info of fnsInfo){

            const fn:FnInfoAndNodeFn={
                info,
                fn:new NodeFn(this,info.name,info.createProps),
            }

            if(info.arnParam && params){
                params.setParam(info.arnParam,fn.fn.func.functionArn,'fn');
                params.addVarContainer({
                    varContainer:fn.fn.func,
                    excludeParams:[info.arnParam],
                    requiredParams:[],
                })
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

        accessManager?.addGroup(this);

    }

}
