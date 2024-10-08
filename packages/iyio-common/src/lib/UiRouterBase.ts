import { Subscription } from "rxjs";
import { BehaviorSubject } from "rxjs/internal/BehaviorSubject";
import { DisposeCallback } from "./common-types";
import { joinPaths } from "./fs";
import { deepClone, deepCompare } from "./object";
import { ReadonlySubject } from "./rxjs-types";
import { IUiRouter, MatchedUiActionItem, RouteInfo, RouteQuery, UiActionRecursiveSubItem, UiRouterEvt, UiRouterEvtListener, UiRouterOpenOptions, addQueryToPath, findMatchingUiActionItem, getWindowLocationRouteInfo } from "./ui-lib";
import { uuid } from "./uuid";

export interface UiRouterBaseOptions
{
    disableAutoChangeChecking?:boolean;
    changeCheckIntervalMs?:number;
    /**
     * Minimum number of milliseconds between a manual route change triggered by one of the public or
     * protected methods of UiRouteBase and auto detected route changes.
     */
    minAutoChangeMarginMs?:number;
    initRoute?:RouteInfo;
}

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

    private readonly _currentRoute:BehaviorSubject<RouteInfo>;
    public get currentRouteSubject():ReadonlySubject<RouteInfo>{return this._currentRoute}
    public get currentRoute(){return this._currentRoute.value}

    protected readonly disableAutoChangeChecking:boolean;
    protected readonly changeCheckIntervalMs:number;
    protected readonly minAutoChangeMarginMs:number;
    protected readonly changeCheckIv:any;

    protected lastTriggerTime:number=0;
    protected lastTriggerPath:string|null=null;

    private readonly _dispose:DisposeCallback|null;
    private readonly checkIv:any;
    private readonly itemsSub:Subscription;

    public constructor({
        disableAutoChangeChecking=false,
        changeCheckIntervalMs=100,
        minAutoChangeMarginMs=1000,
        initRoute=getWindowLocationRouteInfo(),
    }:UiRouterBaseOptions={})
    {
        (globalThis.window as any).______ROUTER=this;
        this.disableAutoChangeChecking=disableAutoChangeChecking;
        this.changeCheckIntervalMs=changeCheckIntervalMs;
        this.minAutoChangeMarginMs=minAutoChangeMarginMs;
        this.checkIv=setInterval(this.historyListener,changeCheckIntervalMs);
        this._currentRoute=new BehaviorSubject<RouteInfo>(initRoute);
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
        clearInterval(this.changeCheckIv);
        this.itemsSub.unsubscribe();
        this.listeners.splice(0,this.listeners.length);
        this._dispose?.();
    }

    private lastCheckKey:string|null=null;
    protected checkForChange(force:boolean,currentRouteKey?:string)
    {
        const key=globalThis.location?globalThis.location.toString():(currentRouteKey??this.getCurrentRoute().key);
        if(!force && key===this.lastCheckKey){
            return;
        }
        this.lastCheckKey=key;
        this.updateActive();
    }

    protected getCurrentUnmatchedRouteItem()
    {
        const route=this.getCurrentRoute();
        const match=findMatchingUiActionItem({to:route.asPath},this.navItemsSubject.value)??null;
        if(!deepCompare(match,this._activeNavItem.value)){
            return match;
        }else{
            return undefined;
        }
    }

    protected updateActive()
    {
        const match=this.getCurrentUnmatchedRouteItem();
        if(match){
            this._activeNavItem.next(match);
        }

    }

    private readonly autoCheck=()=>{
        if( this._loadingCount>0 ||
            (Date.now()-this.lastTriggerTime)<this.minAutoChangeMarginMs ||
            this.lastTriggerPath===null)
        {
            return null;
        }

        const route=this.getCurrentRoute();
        if(route.asPath!==this.lastTriggerPath){
            console.info('Auto push route',route);
            this.handlePushEvtAsync(route.asPath).then(()=>this.triggerRouteChanged())
            return null;
        }else{
            return route;
        }

    }

    protected triggerRouteChanged()
    {
        const route=this.getCurrentRoute();
        try{
            if(!deepCompare(route,this._currentRoute.value)){
                this._currentRoute.next(route);
            }
        }catch(ex){
            console.warn('Error while triggering next currentRoute',ex);
        }
    }

    private readonly historyListener=()=>{
        if(this.isDisposed){
            return;
        }
        const route=this.disableAutoChangeChecking?null:this.autoCheck();
        this.checkForChange(false,route?.key);
    }

    public replace(path:string,query?:RouteQuery):void|Promise<void>
    {
        if(!path.startsWith('/') && globalThis.location){
            path=joinPaths(globalThis.location.pathname,path);
        }
        globalThis.history?.replaceState(null,'',addQueryToPath(path,query))
    }

    public push(path:string,query?:RouteQuery){
        this.pushAsync(path,query);
    }

    private eventIndex=0;

    protected async triggerEventAsync(evt:UiRouterEvt):Promise<void>
    {
        this.lastTriggerTime=Date.now();
        this.lastTriggerPath=evt.type==='push'?evt.path:null;
        for(const listener of this.listeners){
            try{
                await listener(evt);
            }catch(ex){
                console.error('UiRouterEvtListener failed',ex);
            }
            this.lastTriggerTime=Date.now();
            if(evt.index!==this.eventIndex || this._isDisposed){
                evt.cancel=true;
            }
            if(evt.cancel){
                return;
            }
        }
    }

    private async pushAsync(path:string,query?:RouteQuery):Promise<void>{

        const evt=await this.handlePushEvtAsync(path,query);
        if(evt?.cancel){
            return;
        }
        if(evt?.type==='push'){
            path=evt.path;
            query=evt.query;
        }

        if(globalThis.history){
            globalThis.history.pushState(null,'',addQueryToPath(path,query));
        }
    }

    public pop(){
        this.popAsync();
    }

    private async popAsync():Promise<void>{

        const evt=await this.handlePopEvtAsync();
        if(evt?.cancel){
            return;
        }

        if(globalThis.history){
            globalThis.history.back();
        }
        this.triggerRouteChanged();
    }

    public open(uri:string,options?:UiRouterOpenOptions){
        this.openAsync(uri,options);
    }

    private async openAsync(uri:string,options?:UiRouterOpenOptions):Promise<void>{

        const evt=await this.handleOpenEvtAsync(uri,options);
        if(evt?.cancel){
            return;
        }
        if(evt?.type==='open'){
            uri=evt.uri;
            options=evt.options;
        }

        if(globalThis.window){
            globalThis.window.open(uri,options?.target,options?.target==='_blank'?'noreferrer':undefined)
        }
    }

    protected async handlePushEvtAsync(path:string,query?:RouteQuery):Promise<UiRouterEvt|undefined>
    {
        const index=++this.eventIndex;

        if(!this.listeners.length){
            return undefined;
        }

        const evt:UiRouterEvt={
            index,
            cancel:false,
            type:'push',
            path,
            query:deepClone(query),
        }
        await this.triggerEventAsync(evt);
        return evt;
    }

    protected async handlePopEvtAsync():Promise<UiRouterEvt|undefined>
    {
        const index=++this.eventIndex;

        if(!this.listeners.length){
            return undefined;
        }

        const evt:UiRouterEvt={
            index,
            cancel:false,
            type:'pop',
        }
        await this.triggerEventAsync(evt);
        return evt;
    }

    protected async handleOpenEvtAsync(uri:string,options?:UiRouterOpenOptions):Promise<UiRouterEvt|undefined>
    {
        const index=++this.eventIndex;

        if(!this.listeners.length){
            return undefined;
        }

        const evt:UiRouterEvt={
            index,
            cancel:false,
            type:'open',
            uri,
            options:deepClone(options),
        }
        await this.triggerEventAsync(evt);
        return evt;
    }

    public getCurrentRoute():RouteInfo
    {
        return getWindowLocationRouteInfo();
    }

    private readonly listeners:UiRouterEvtListener[]=[];

    public addListener(listener:UiRouterEvtListener):void
    {
        if(this._isDisposed){
            return;
        }
        this.listeners.push(listener);
    }

    public addListenerWithDispose(listener:UiRouterEvtListener):DisposeCallback
    {
        if(this._isDisposed){
            return ()=>{/* */}
        }
        this.listeners.push(listener);
        return ()=>{
            this.removeListener(listener);
        }
    }

    public removeListener(listener:UiRouterEvtListener):boolean
    {
        const i=this.listeners.indexOf(listener);
        if(i===-1){
            return false;
        }

        this.listeners.splice(i,1);
        return true;
    }

}
