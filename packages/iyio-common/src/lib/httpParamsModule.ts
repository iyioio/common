import { getHttpParamsAsync } from "./getHttpParamsAsync";
import { ScopeModulePriorities } from "./scope-lib";
import { ScopeRegistration } from "./scope-types";

export const httpParamsModule=(reg:ScopeRegistration)=>{
    reg.use({
        priority:ScopeModulePriorities.config,
        init:async ()=>{
            const params=await getHttpParamsAsync();
            if(params){
                reg.addParams(params);
            }
        }
    })
}
