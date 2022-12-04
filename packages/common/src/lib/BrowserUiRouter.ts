import { UnsupportedError } from "./errors";
import { addQueryToPath, IUiRouter, RouteQuery, shouldUseNativeNavigation } from "./ui-lib";

export interface BrowserUiRouterOptions
{
    /**
     * If true routes will be set using history to push new routes.
     */
    useHistory?:boolean;
}

export class BrowserUiRouter implements IUiRouter
{

    public static isSupported(){
        return (typeof globalThis.history !== 'undefined') || (typeof globalThis.location !== 'undefined');
    }

    private readonly options:BrowserUiRouterOptions;

    public constructor(options:BrowserUiRouterOptions={})
    {
        if(!BrowserUiRouter.isSupported()){
            throw new UnsupportedError('BrowserUiRouter is not supported because history is not defined');
        }
        this.options={...options}
    }

    public push(path:string,query?:RouteQuery){
        if(shouldUseNativeNavigation(path) || !this.options.useHistory){
            globalThis.location.assign(addQueryToPath(path,query));
        }else{
            globalThis.history.pushState(null,'',addQueryToPath(path,query));
        }
    }

    public pop(){
        globalThis.history.back();
    }

}
