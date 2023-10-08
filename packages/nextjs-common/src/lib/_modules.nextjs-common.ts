import { ScopeRegistration, uiRouterService } from "@iyio/common";
import { NextJsUiRouter } from "./NextJsUiRouter";

export const nextJsModule=(reg:ScopeRegistration)=>{
    reg.implementService(uiRouterService,()=>new NextJsUiRouter());
}
