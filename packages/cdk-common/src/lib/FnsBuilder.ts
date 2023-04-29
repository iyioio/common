import { ParamTypeDef } from "@iyio/common";
import * as cdk from "aws-cdk-lib";
import * as cf from "aws-cdk-lib/aws-cloudfront";
import { Construct } from "constructs";
import { ManagedProps } from "./ManagedProps";
import { NodeFn, NodeFnProps } from "./NodeFn";
import { AccessGranter, AccessRequest, AccessRequestDescription, IAccessGrantGroup, IAccessRequestGroup, SiteContentSourceDescription } from "./cdk-types";

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
    urlParam?:ParamTypeDef<string>;
    grantAccess?:boolean;
    accessRequests?:AccessRequestDescription[];
    /**
     * createProps.createPublicUrl must be true in-order for siteSources to be applied
     */
    siteSources?:SiteContentSourceDescription[];
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
            accessManager,
            siteContentSources
        }={},
    }:FnsBuilderProps){

        super(scope,name);

        const fns:FnInfoAndNodeFn[]=[];

        for(const info of fnsInfo){

            const nodeFn=new NodeFn(this,info.name,info.createProps);

            const fn:FnInfoAndNodeFn={
                info,
                fn:nodeFn
            }

            if(params){
                const excludeParams:ParamTypeDef<string>[]=[];
                if(info.arnParam){
                    params.setParam(info.arnParam,nodeFn.func.functionArn,'fn');
                    excludeParams.push(info.arnParam);
                }
                if(info.urlParam && nodeFn.url){
                    params.setParam(info.urlParam,nodeFn.url.url,'fn');
                    excludeParams.push(info.urlParam);
                }
                params.addVarContainer({
                    varContainer:nodeFn.func,
                    excludeParams,
                    requiredParams:[],
                })
            }

            if(info.grantAccess){
                this.accessGrants.push({
                    grantName:info.name,
                    grant:request=>{
                        if(request.types?.includes('invoke')){
                            nodeFn.func.grantInvoke(request.grantee);
                            if(nodeFn.url){
                                nodeFn.func.grantInvokeUrl(request.grantee);
                            }
                        }
                    }
                })
            }

            if(info.accessRequests){
                this.accessRequests.push(...info.accessRequests.map(i=>({...i,grantee:nodeFn.func})));
            }

            const fnUrl=nodeFn.url;
            if(info.siteSources && siteContentSources && fnUrl){
                for(const ss of info.siteSources){
                    const sourceDomain=cdk.Fn.select(2,cdk.Fn.split('/',nodeFn.url.url));
                    siteContentSources.push({
                        ...ss,
                        sourceDomain,
                        fn:nodeFn.func,
                        source:{
                            customOriginSource:{
                                domainName:sourceDomain,
                                originProtocolPolicy:cf.OriginProtocolPolicy.HTTPS_ONLY,
                            },
                            behaviors:[{
                                viewerProtocolPolicy:cf.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                                compress:true,
                                allowedMethods:cf.CloudFrontAllowedMethods.GET_HEAD_OPTIONS,
                                pathPattern:ss.prefix?ss.prefix+'*':'*',

                            }],
                        },
                    })
                }
            }

            fns.push(fn);
        }

        this.fns=fns;

        accessManager?.addGroup(this);

    }

}
