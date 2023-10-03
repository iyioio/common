import { atDotCssRenderer } from "@iyio/at-dot-css";
import { ScopeRegistration, uiRouterService } from "@iyio/common";
import { NextJsAtDotCssRenderer } from "./NextJsAtDotCssRenderer";
import { NextJsUiRouter } from "./NextJsUiRouter";

export const nextJsModule=(reg:ScopeRegistration)=>{
    reg.implementService(uiRouterService,()=>new NextJsUiRouter());
    reg.implementService(atDotCssRenderer,()=>new NextJsAtDotCssRenderer());
}
