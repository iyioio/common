import { getHttpParamsAsync } from "./getHttpParamsAsync";
import { ScopeModulePriorities } from "./scope-lib";
import { ScopeRegistration } from "./scope-types";

export const httpParamsModule=(reg:ScopeRegistration)=>{
    reg.use({
        priority:ScopeModulePriorities.config,
        init:async ()=>{
            if(globalThis.document){
                const json=globalThis.document?.getElementById('__DOT_ENV__')?.textContent;
                if(json){
                    try{
                        const inlineParams=JSON.parse(json);
                        if(inlineParams && (typeof inlineParams === 'object')){
                            reg.addParams(inlineParams)
                            return;
                        }
                    }catch{
                        // do nothing
                    }
                }
            }
            const params=await getHttpParamsAsync();
            if(params){
                reg.addParams(params);
            }
        }
    })
}
