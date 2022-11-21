import { HashMap } from "./common-types";
import { getUriHost, getUriProtocol } from "./uri";

export interface UiActionItem
{
    id?:string;
    title?:string;
    icon?:string;
    to?:string;
    action?:(item:UiActionItem)=>void;
}

export type RouteQuery=HashMap<string|string[]>;

export interface IUiRouter
{
    push(path:string,query?:RouteQuery):void|Promise<void>;

    pop():void|Promise<void>;
}

export const addQueryToPath=(path:string,query:RouteQuery|null|undefined)=>{
    if(!query){
        return path;
    }

    if(!path.includes('?')){
        path+='?';
    }

    for(const e in query){
        const q=query[e];
        if(Array.isArray(q)){
            for(const v of q){
                path+=encodeURIComponent(e)+'[]='+encodeURIComponent(v)+'&';
            }
        }else{
            path+=encodeURIComponent(e)+'='+encodeURIComponent(q)+'&';
        }
    }

    path=path.substring(0,path.length-1);

    return path;
}

export const shouldUseNativeNavigation=(path:string)=>(
    getUriProtocol(path) &&
    globalThis.location &&
    getUriHost(path)?.toLowerCase()!==global.location.host
    ?true:false
)