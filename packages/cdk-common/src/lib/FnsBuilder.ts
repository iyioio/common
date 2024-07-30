import { AccessRequestDescription, ParamTypeDef, PassiveAccessGrantDescription } from "@iyio/common";
import * as cdk from "aws-cdk-lib";
import * as cf from "aws-cdk-lib/aws-cloudfront";
import { Construct } from "constructs";
import { ManagedProps, getDefaultManagedProps } from "./ManagedProps";
import { NodeFn, NodeFnProps } from "./NodeFn";
import { AccessGranter, AccessRequest, EnvVarTarget, IAccessGrantGroup, IAccessRequestGroup, IPassiveAccessTargetGroup, PassiveAccessTarget, SiteContentSourceDescription } from "./cdk-types";

export interface FnInfoAndNodeFn
{
    info:FnInfo;
    fn:NodeFn;
}

export interface FnInfo
{
    name:string;
    grantName?:string;
    createProps:NodeFnProps;
    arnParam?:ParamTypeDef<string>;
    urlParam?:ParamTypeDef<string>;
    grantAccess?:boolean;
    accessRequests?:AccessRequestDescription[];
    grantAccessRequests?:PassiveAccessGrantDescription[];
    noPassiveAccess?:boolean;
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

export class FnsBuilder extends Construct implements IAccessGrantGroup, IAccessRequestGroup, IPassiveAccessTargetGroup
{

    public readonly fns:FnInfoAndNodeFn[];

    public readonly accessGrants:AccessGranter[]=[];

    public readonly accessRequests:AccessRequest[]=[];

    public passiveTargets:PassiveAccessTarget[]=[];


    public constructor(scope:Construct,name:string,{
        fnsInfo,
        managed:{
            params,
            accessManager,
            siteContentSources,
            fns:managedFns,
            apiRouteTargets,
            resources,
        }=getDefaultManagedProps(),
    }:FnsBuilderProps){

        super(scope,name);

        const fns:FnInfoAndNodeFn[]=[];

        for(const info of fnsInfo){

            const nodeFn=new NodeFn(this,info.name,info.createProps);

            apiRouteTargets.push({
                fn:nodeFn.func,
                targetName:info.name,
            })
            resources.push({name:info.name,fn:nodeFn.func})


            const fn:FnInfoAndNodeFn={
                info,
                fn:nodeFn
            }

            let varContainer:EnvVarTarget|undefined=undefined;

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
                varContainer={
                    name:info.name,
                    varContainer:nodeFn.func,
                    excludeParams,
                    requiredParams:[],
                    fn:nodeFn.func,
                }
                params.addVarContainer(varContainer)
            }

            if(info.grantAccess){
                this.accessGrants.push({
                    grantName:info.grantName??info.name,
                    passiveGrants:info.grantAccessRequests,
                    grant:request=>{
                        if(request.types?.includes('invoke')){
                            nodeFn.func.grantInvoke(request.grantee);
                            if(nodeFn.url){
                                nodeFn.func.grantInvokeUrl(request.grantee);
                            }
                            if(request.varContainer){
                                if(info.arnParam){
                                    request.varContainer.requiredParams.push(info.arnParam);
                                }
                                if(info.urlParam){
                                    request.varContainer.requiredParams.push(info.urlParam);
                                }
                            }
                        }
                    }
                })
            }

            if(info.accessRequests){
                this.accessRequests.push(...info.accessRequests.map(i=>({
                    ...i,
                    varContainer,
                    grantee:nodeFn.func
                })));
            }

            if(!info.noPassiveAccess){
                this.passiveTargets.push({
                    isFn:true,
                    targetName:info.name,
                    grantee:nodeFn.func,
                    varContainer
                })
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

            managedFns?.push({
                name:info.name,
                fn:fn.fn.func,
                url:nodeFn.url,
                domain:nodeFn.url?cdk.Fn.select(2,cdk.Fn.split('/',nodeFn.url.url)):undefined,
            })
        }

        this.fns=fns;

        accessManager?.addGroup(this);

    }

}
