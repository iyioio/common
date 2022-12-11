import { addQueryToPath, RouteQuery, shouldUseNativeNavigation, UiRouterBase } from "@iyio/common";
import Router from 'next/router';

export class NextJsUiRouter extends UiRouterBase
{

    public override async push(path:string,query?:RouteQuery){
        if(shouldUseNativeNavigation(path)){
            globalThis.location.assign(addQueryToPath(path,query));
        }else{
            try{
                this.loadingCount++;
                await Router.push(addQueryToPath(path,query));
            }finally{
                this.loadingCount--;
            }
        }
    }
    public override pop(){
        Router.back();
    }

}
