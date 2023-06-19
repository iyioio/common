import { UnsupportedError } from "./errors";
import { addQueryToPath, RouteQuery, shouldUseNativeNavigation } from "./ui-lib";
import { UiRouterBase } from "./UiRouterBase";

export interface BrowserUiRouterOptions
{
    /**
     * If true routes will be set using history to push new routes.
     */
    useHistory?:boolean;
}

export class BrowserUiRouter extends UiRouterBase
{

    public static isSupported(){
        return (typeof globalThis.history !== 'undefined') || (typeof globalThis.location !== 'undefined');
    }

    private readonly options:BrowserUiRouterOptions;

    public constructor(options:BrowserUiRouterOptions={})
    {
        super();
        if(!BrowserUiRouter.isSupported()){
            throw new UnsupportedError('BrowserUiRouter is not supported because history is not defined');
        }
        this.options={...options}
    }

    public override async push(path:string,query?:RouteQuery){

        const evt=await this.handlePushEvtAsync(path,query);
        if(evt?.cancel){
            return;
        }
        if(evt?.type==='push'){
            path=evt.path;
            query=evt.query;
        }

        if(shouldUseNativeNavigation(path) || !this.options.useHistory){
            globalThis.location.assign(addQueryToPath(path,query));
        }else{
            globalThis.history.pushState(null,'',addQueryToPath(path,query));
        }
    }

    public override pop(){
        globalThis.history.back();
    }

}
