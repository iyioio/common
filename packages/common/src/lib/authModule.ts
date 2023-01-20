import { authService } from "./auth.deps";
import { ScopeModulePriorities } from "./scope-lib";
import { ScopeRegistration } from "./scope-types";

export const authModule=(reg:ScopeRegistration)=>{
    reg.use({
        priority:ScopeModulePriorities._2,
        init:async scope=>{
            await authService(scope).init();
        }
    })
}
