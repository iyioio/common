import { Subscription } from "rxjs";
import { BehaviorSubject } from "rxjs/internal/BehaviorSubject";
import { DisposeCallback } from "./common-types";
import { deepCompare, queryParamsToObject } from "./object";
import { ReadonlySubject } from "./rxjs-types";
import { IUiRouter, MatchedUiActionItem, RouteInfo, RouteQuery, UiActionRecursiveSubItem, UiRouterOpenOptions, addQueryToPath, findMatchingUiActionItem } from "./ui-lib";
import { uuid } from "./uuid";


export class UiRouterBase implements IUiRouter
{

    public routeId=uuid();

    public readonly navItemsSubject:BehaviorSubject<UiActionRecursiveSubItem[]>=new BehaviorSubject<UiActionRecursiveSubItem[]>([]);
    public get navItems(){return this.navItemsSubject.value}

    private readonly _activeNavItem:BehaviorSubject<MatchedUiActionItem|null>=new BehaviorSubject<MatchedUiActionItem|null>(null);
    public get activeNavItemSubject():ReadonlySubject<MatchedUiActionItem|null>{return this._activeNavItem}
    public get activeNavItem(){return this._activeNavItem.value}

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

    private readonly _dispose:DisposeCallback|null;
    private readonly checkIv:any;
    private readonly itemsSub:Subscription;

    public constructor()
    {
        this.checkIv=setInterval(this.historyListener,30);
        if(globalThis.window){
            globalThis.window.addEventListener('popstate',this.historyListener);
            globalThis.window.addEventListener('hashchange',this.historyListener);
            this._dispose=()=>{
                globalThis.window.removeEventListener('popstate',this.historyListener);
                globalThis.window.removeEventListener('hashchange',this.historyListener);
            }
        }else{
            this._dispose=null;
        }
        this.itemsSub=this.navItemsSubject.subscribe(()=>{
            this.checkForChange(true);
        })
    }

    private _isDisposed=false;
    public get isDisposed(){return this._isDisposed}
    public dispose()
    {
        if(this._isDisposed){
            return;
        }
        this._isDisposed=true;
        clearInterval(this.checkIv);
        this.itemsSub.unsubscribe();
        this._dispose?.();
    }

    private lastCheckKey:string|null=null;
    protected checkForChange(force:boolean)
    {
        const key=globalThis.location?globalThis.location.toString():this.getCurrentRoute().key;
        if(!force && key===this.lastCheckKey){
            return;
        }
        this.lastCheckKey=key;
        this.updateActive();
    }

    protected updateActive()
    {
        const route=this.getCurrentRoute();
        const match=findMatchingUiActionItem({to:route.asPath},this.navItemsSubject.value)??null;
        if(!deepCompare(match,this._activeNavItem.value)){
            this._activeNavItem.next(match);
        }

    }

    private readonly historyListener=()=>{
        if(this.isDisposed){
            return;
        }
        this.checkForChange(false);
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
