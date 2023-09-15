import { addQueryToPath, RouteInfo, RouteQuery, shouldUseNativeNavigation, UiRouterBase } from "@iyio/common";
import Router from 'next/router';
import { getRouteInfo } from "./next-route-helper";

export class NextJsUiRouter extends UiRouterBase
{

    public override async push(path:string,query?:RouteQuery){

        this.loadingCount++;

        try{
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
    }
    public override pop(){
        Router.back();
    }

    public override getCurrentRoute():RouteInfo{
        return getRouteInfo(Router);
    }

}
