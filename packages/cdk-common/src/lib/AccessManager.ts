import { PassiveAccessGrantDescription } from "@iyio/common";
import * as iam from "aws-cdk-lib/aws-iam";
import { addPolicyToGrantee } from './cdk-lib';
import { AccessGranter, AccessRequest, IAccessGrantGroup, IAccessRequestGroup, IPassiveAccessTargetGroup, PassiveAccessTarget } from "./cdk-types";


export const grantAccessRequest=(request:AccessRequest,granter:AccessGranter)=>{

    granter.grant?.(request);

    if(granter.getPolicy){
        addPolicyToGrantee(request.grantee,()=>granter.getPolicy?.(request))
    }
}

export class AccessManager
{
    public readonly granters:AccessGranter[]=[];

    public readonly requests:AccessRequest[]=[];

    public readonly passiveTargets:PassiveAccessTarget[]=[];

    public readonly account:string;

    public readonly defaultRegion:string;

    public constructor(account:string,defaultRegion:string)
    {
        this.account=account;
        this.defaultRegion=defaultRegion;
    }

    private tryGrantPassive(
        pass:PassiveAccessGrantDescription,
        target:PassiveAccessTarget,
        granter:AccessGranter
    ):boolean{
        if( pass.grantName===target.targetName ||
            (
                pass.targetName!==target.targetName &&
                !pass.all &&
                !(target.isFn && pass.allFns)
            )
        ){
            return false;
        }
        grantAccessRequest({
            grantee:target.grantee,
            grantName:target.targetName,
            types:pass.types,
            varContainer:target.varContainer,
        },granter);

        return true;
    }


    public addGranter(granter:AccessGranter){
        for(const request of this.requests){
            if(request.grantName===granter.grantName){
                grantAccessRequest(request,granter);
            }
        }
        if(granter.passiveGrants){
            for(const pass of granter.passiveGrants){
                for(const target of this.passiveTargets){
                    this.tryGrantPassive(pass,target,granter);
                }
            }
        }
        this.granters.push(granter);
    }


    public addPassiveTarget(target:PassiveAccessTarget){
        for(const granter of this.granters){
            if(!granter.passiveGrants){
                continue;
            }
            for(const pass of granter.passiveGrants){
                this.tryGrantPassive(pass,target,granter);
            }
        }
        this.passiveTargets.push(target);
    }


    public addGrantGroup(group:IAccessGrantGroup|AccessGranter[]|null|undefined){
        if(!group){
            return;
        }
        const ary=Array.isArray(group)?group:group.accessGrants;
        for(const g of ary){
            this.addGranter(g);
        }

    }

    private insertVars(val:string):string{
        return val.replace(/\{(\w+)\}/g,(_,name:string)=>{
            switch(name){

                case 'account':
                    return this.account;

                case 'region':
                    return this.defaultRegion;

                default:
                    return '';
            }
        })
    }

    public addRequest(request:AccessRequest){
        const iamPolicy=request.iamPolicy;
        if(iamPolicy){
            addPolicyToGrantee(request.grantee,()=>new iam.PolicyStatement({
                effect:iamPolicy.allow?iam.Effect.ALLOW:iam.Effect.DENY,
                actions:iamPolicy.actions.map(v=>this.insertVars(v)),
                resources:iamPolicy.resources.map(v=>this.insertVars(v)),
            }));
            return;
        }

        for(const granter of this.granters){
            if(request.grantName===granter.grantName){
                grantAccessRequest(request,granter);
            }
        }
        this.requests.push(request);
    }


    public addRequestGroup(group:IAccessRequestGroup|AccessRequest[]|null|undefined){
        if(!group){
            return;
        }
        const ary=Array.isArray(group)?group:group.accessRequests;
        for(const r of ary){
            this.addRequest(r);
        }

    }


    public addPassiveTargetGroup(group:IPassiveAccessTargetGroup|null|undefined){
        if(!group){
            return;
        }
        for(const t of group.passiveTargets){
            this.addPassiveTarget(t);
        }

    }


    public addGroup(group:IAccessRequestGroup|IAccessGrantGroup|IPassiveAccessTargetGroup|null|undefined){
        if(!group){
            return;
        }
        if((group as IAccessGrantGroup).accessGrants){
            this.addGrantGroup(group as IAccessGrantGroup);
        }
        if((group as IAccessRequestGroup).accessRequests){
            this.addRequestGroup(group as IAccessRequestGroup);
        }
        if((group as IPassiveAccessTargetGroup).passiveTargets){
            this.addPassiveTargetGroup(group as IPassiveAccessTargetGroup);
        }

    }
}
