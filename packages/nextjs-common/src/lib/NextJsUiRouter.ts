import { addQueryToPath, joinPaths, RouteInfo, RouteQuery, shouldUseNativeNavigation, UiRouterBase, UiRouterBaseOptions } from "@iyio/common";
import Router from 'next/router';
import { getRouteInfo } from "./next-route-helper.js";

export class NextJsUiRouter extends UiRouterBase
{

    public constructor(options:UiRouterBaseOptions={})
    {
        super({
            initRoute:getRouteInfo(Router),
            ...options,
        })
    }

    public override async push(path:string,query?:RouteQuery){

        this.loadingCount++;
        try{
            if(!path.startsWith('/') && globalThis.location){
                path=joinPaths(globalThis.location.pathname,path);
            }
            const evt=await this.handlePushEvtAsync(path,query);
            if(evt?.cancel){
                return;
            }
            if(evt?.type==='push'){
                path=evt.path;
                query=evt.query;
            }

            if(shouldUseNativeNavigation(path)){
                globalThis.location.assign(addQueryToPath(path,query));
            }else{
                await Router.push(addQueryToPath(path,query));
            }

        }finally{
            this.loadingCount--;
        }
        this.triggerRouteChanged();
    }
    public override pop(){
        Router.back();
        this.triggerRouteChanged();
    }

    public override getCurrentRoute():RouteInfo{
        return getRouteInfo(Router);
    }

}
