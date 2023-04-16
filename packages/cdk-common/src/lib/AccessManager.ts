import { addPolicyToGrantee } from './cdk-lib';
import { AccessGranter, AccessRequest, IAccessGrantGroup, IAccessRequestGroup } from "./cdk-types";


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


    public addGranter(granter:AccessGranter){
        for(const request of this.requests){
            if(request.grantName===granter.grantName){
                grantAccessRequest(request,granter);
            }
        }
        this.granters.push(granter);
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


    public addRequest(request:AccessRequest){
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


    public addGroup(group:IAccessRequestGroup|IAccessGrantGroup|null|undefined){
        if(!group){
            return;
        }
        if((group as IAccessGrantGroup).accessGrants){
            this.addGrantGroup(group as IAccessGrantGroup);
        }
        if((group as IAccessRequestGroup).accessRequests){
            this.addRequestGroup(group as IAccessRequestGroup);
        }

    }
}
