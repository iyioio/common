import { addQueryToPath, IUiRouter, RouteQuery, shouldUseNativeNavigation } from "@iyio/common";
import Router from 'next/router';

export class NextJsUiRouter implements IUiRouter
{
    push(path:string,query?:RouteQuery){
        if(shouldUseNativeNavigation(path)){
            globalThis.location.assign(addQueryToPath(path,query));
        }else{
            Router.push(addQueryToPath(path,query));
        }
    }
    pop(){
        Router.back();
    }

}
