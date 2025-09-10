import { BrowserUiRouter } from "./BrowserUiRouter.js";
import { defineService } from "./scope-lib.js";
import { IUiRouter } from "./ui-lib.js";
import { UiRouterBase } from "./UiRouterBase.js";

export const uiRouterService=defineService<IUiRouter>(
    'uiRouterService',()=>BrowserUiRouter.isSupported()?new BrowserUiRouter():new UiRouterBase());
