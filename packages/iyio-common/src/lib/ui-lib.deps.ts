import { BrowserUiRouter } from "./BrowserUiRouter";
import { defineService } from "./scope-lib";
import { IUiRouter } from "./ui-lib";
import { UiRouterBase } from "./UiRouterBase";

export const uiRouterService=defineService<IUiRouter>(
    'uiRouterService',()=>BrowserUiRouter.isSupported()?new BrowserUiRouter():new UiRouterBase());
