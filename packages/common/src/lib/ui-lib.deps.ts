import { BrowserUiRouter } from "./BrowserUiRouter";
import { defineService } from "./scope-lib";
import { IUiRouter } from "./ui-lib";

export const uiRouterService=defineService<IUiRouter>(
    'uiRouterService',BrowserUiRouter.isSupported()?()=>new BrowserUiRouter():undefined);
