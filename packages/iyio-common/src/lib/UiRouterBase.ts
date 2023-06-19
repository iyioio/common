import { Subscription } from "rxjs";
import { BehaviorSubject } from "rxjs/internal/BehaviorSubject";
import { DisposeCallback } from "./common-types";
import { deepClone, deepCompare, queryParamsToObject } from "./object";
import { ReadonlySubject } from "./rxjs-types";
import { IUiRouter, MatchedUiActionItem, RouteInfo, RouteQuery, UiActionRecursiveSubItem, UiRouterEvt, UiRouterEvtListener, UiRouterOpenOptions, addQueryToPath, findMatchingUiActionItem } from "./ui-lib";
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
        this.listeners.splice(0,this.listeners.length);
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
        this.pushAsync(path,query);
    }

    private eventIndex=0;

    protected async triggerEventAsync(evt:UiRouterEvt):Promise<void>
    {
        for(const listener of this.listeners){
            try{
                await listener(evt);
            }catch(ex){
                console.error('UiRouterEvtListener failed',ex);
            }
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
