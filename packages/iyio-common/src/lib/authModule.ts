import { authService } from "./auth.deps.js";
import { ScopeModulePriorities } from "./scope-lib.js";
import { ScopeRegistration } from "./scope-types.js";

export const authModule=(reg:ScopeRegistration)=>{
    reg.use({
        priority:ScopeModulePriorities._2,
        init:async scope=>{
            await authService(scope).init();
        }
    })
}
