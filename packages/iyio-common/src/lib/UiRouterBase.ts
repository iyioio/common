import { BehaviorSubject } from "rxjs/internal/BehaviorSubject";
import { queryParamsToObject } from "./object";
import { ReadonlySubject } from "./rxjs-types";
import { addQueryToPath, IUiRouter, RouteInfo, RouteQuery, UiRouterOpenOptions } from "./ui-lib";


export class UiRouterBase implements IUiRouter
{

    private readonly _isLoading:BehaviorSubject<boolean>=new BehaviorSubject<boolean>(false);
    public get isLoadingSubject():ReadonlySubject<boolean>{return this._isLoading}
    public get isLoading(){return this._isLoading.value}

    private _loadingCount:number=0;
    protected get loadingCount(){return this._loadingCount}
    protected set loadingCount(value:number){
        if(this._loadingCount===value){return}
        this._loadingCount=value;
        this._isLoading.next(value>0);
    }

    public push(path:string,query?:RouteQuery){
        if(globalThis.history){
            globalThis.history.pushState(null,'',addQueryToPath(path,query));
        }
    }

    public pop(){
        if(globalThis.history){
            globalThis.history.back();
        }
    }

    public open(uri:string,options?:UiRouterOpenOptions){
        if(globalThis.window){
            globalThis.window.open(uri,options?.target,options?.target==='_blank'?'noreferrer':undefined)
        }
    }

    public getCurrentRoute():RouteInfo
    {
        if(!globalThis.window){
            return {
                key:'_',
                path:'',
                route:'',
                asPath:'',
                query:{},
            }
        }
        return {
            key:window.history?((window.history.state as any).key??'_'):'_',
            path:window.location.pathname,
            route:window.location.pathname,
            asPath:window.location.pathname+window.location.search,
            query:queryParamsToObject(window.location.search),
        }
    }

}
