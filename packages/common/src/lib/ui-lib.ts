import { HashMap } from "./common-types";
import { ReadonlySubject } from "./rxjs-types";
import { getUriHost, getUriProtocol } from "./uri";

export interface UiActionItem
{
    id?:string;
    title?:string;
    icon?:string;
    to?:string;
    action?:(item:UiActionItem)=>void;
    linkTarget?:string;
    data?:any;
}

export interface UiActionSubItem extends UiActionItem
{
    sub?:UiActionItem[];
}

export interface UiActionRecursiveSubItem extends UiActionItem
{
    sub?:UiActionRecursiveSubItem[];
}

export type RouteQuery=HashMap<string|string[]>;

export interface RouteInfo
{
    key:string;
    path:string;
    route:string;
    asPath:string;
    query:HashMap<string|string[]|undefined>;
}

export interface UiRouterOpenOptions
{
    target?:string;
}

export interface IUiRouter
{

    readonly isLoadingSubject:ReadonlySubject<boolean>;

    push(path:string,query?:RouteQuery):void|Promise<void>;

    pop():void|Promise<void>;

    open(uri:string,options?:UiRouterOpenOptions):void|Promise<void>;

    getCurrentRoute():RouteInfo;
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
    getUriHost(path)?.toLowerCase()!==globalThis.location.host
    ?true:false
)
