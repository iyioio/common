import { CancelToken } from "./CancelToken";
import { DisposedError, UnsupportedError } from "./errors";
import { ListPointer, ValuePointer } from "./pointers";
import { Query } from "./query-types";
import { Scope } from "./scope-types";
import { isStoreScopeMatch } from "./store-lib";
import { CreateStoreValueResult, isIWithStoreAdapter, IStore, IWithStoreAdapter, StoreMatch, StoreOp, StoreOpMethods, StoreProvider } from "./store-types";

export interface StoreRoute
{
    path:string;
    provider?:StoreProvider;
    create?:(scope:Scope)=>IStore|IWithStoreAdapter;
    store?:IStore;
}

/**
 * RouteStore routes request to child stores
 */
export class RouterStore<T=any> implements IStore<T>, Required<StoreOpMethods<T>>
{

    private readonly routes:StoreRoute[]=[];

    private readonly scope:Scope;


    private _isDisposed=false;
    public get isDisposed(){return this._isDisposed}

    public constructor(scope:Scope)
    {
        this.scope=scope;
    }

    public dispose()
    {
        if(this._isDisposed){
            return;
        }

        this._isDisposed=true;

        for(const p of this.routes){
            p.store?.dispose?.();
        }
    }

    public getWatchCount():number{
        let c=0;
        for(const r of this.routes){
            if(r.store?.getWatchCount!==undefined){
                c+=r.store.getWatchCount();
            }
        }
        return c;
    }

    private formatPath(path:string){
        if(path.startsWith('/')){
            path=path.substring(1);
        }

        if(path && !path.endsWith('/')){
            path+='/';
        }
        return path;
    }

    public mountRoute(route:StoreRoute)
    {
        if(!route.create && !route.provider && !route.store){
            throw new Error('Invalid StoreRoute. create, provider or store required');
        }

        this.routes.push({
            ...route,
            path:this.formatPath(route.path),
        });

        this.sortRoutes();
    }

    public mount(path:string,provider:IStore|IWithStoreAdapter|StoreProvider|((scope:Scope)=>IStore|IWithStoreAdapter))
    {
        path=this.formatPath(path);

        if((provider as Partial<StoreProvider>).providerType){
            this.routes.push({
                path,
                provider:provider as StoreProvider
            });
        }else if(typeof provider === 'function'){
            this.routes.push({
                path,
                create:provider
            })
        }else if(isIWithStoreAdapter(provider)){
            this.routes.push({
                path,
                store: provider.getStoreAdapter()
            });
        }else{
            this.routes.push({
                path,
                store: provider
            });
        }

        this.sortRoutes();
    }

    private sortRoutes()
    {
        this.routes.sort((a,b)=>b.path.length-a.path.length);
    }

    public getRouteMatch(key:string,op?:StoreOp):StoreMatch|undefined
    {
        if(this._isDisposed){
            throw new DisposedError('KeyStore disposed');
        }

        if(key.startsWith('/')){
            key=key.substring(1);
        }

        for(const route of this.routes){

            if(key && route.path && !key.startsWith(route.path)){
                continue;
            }

            const routeKey=key.substring(route.path.length);

            if(!route.store){
                let store:IStore|IWithStoreAdapter|null;
                if(route.create){
                    store=route.create(this.scope);
                }else if(route.provider && isStoreScopeMatch(routeKey,route.provider,op)){
                    store=this.scope.require(route.provider.providerType);
                }else{
                    store=null;
                }
                if(store){
                    if(isIWithStoreAdapter(store)){
                        route.store=store.getStoreAdapter();
                    }else{
                        route.store=store;
                    }
                }
            }

            if(route.store){
                const scopedKey=isStoreScopeMatch(routeKey,route.store,op);
                if(scopedKey!==false){
                    return {
                        store:route.store,
                        scopedKey
                    }
                }
            }
        }

        return undefined;
    }

    public requireRouteMatch(key:string,op?:StoreOp):StoreMatch
    {
        if(key.startsWith('/')){
            key=key.substring(1);
        }

        const match=this.getRouteMatch(key,op);
        if(!match){
            throw new Error(`No store found for key ${key}${op?` and op ${op}`:''}`)
        }
        return match;
    }

    public async getAsync<TK extends T=T>(key:string,cancel?:CancelToken):Promise<TK|undefined>
    {
        if(key.startsWith('/')){
            key=key.substring(1);
        }

        const match=this.getRouteMatch(key,'get');
        if(!match?.store.getAsync){
            return undefined;
        }

        return await match.store.getAsync(match.scopedKey,cancel);
    }

    public supports(key:string,op:StoreOp):boolean{
        if(key.startsWith('/')){
            key=key.substring(1);
        }

        return this.getRouteMatch(key,op)?true:false;
    }

    public async putAsync<TK extends T=T>(key:string, value:TK,cancel?:CancelToken):Promise<void>
    {
        if(key.startsWith('/')){
            key=key.substring(1);
        }

        const match=this.getRouteMatch(key,'put');
        if(!match?.store.putAsync){
            throw new UnsupportedError(`put is not supported on key ${key}`);
        }

        await match.store.putAsync(match.scopedKey,value,cancel);
    }

    public async patchAsync<TK extends T=T>(key:string,value:Partial<TK>,cancel?:CancelToken):Promise<void>
    {
        if(key.startsWith('/')){
            key=key.substring(1);
        }

        const match=this.getRouteMatch(key,'patch');
        if(!match?.store.patchAsync){
            throw new UnsupportedError(`patch is not supported on key ${key}`);
        }

        await match.store.patchAsync<TK>(match.scopedKey,value,cancel);
    }

    public async createAsync<TK extends T=T>(
        baseKey:string,
        primaryKey:(keyof TK)|null|undefined,
        value:Partial<TK>,cancel?:CancelToken)
        :Promise<CreateStoreValueResult<TK>>
    {
        if(baseKey.startsWith('/')){
            baseKey=baseKey.substring(1);
        }

        const match=this.getRouteMatch(baseKey,'create');
        if(!match?.store.createAsync){
            throw new UnsupportedError(`create is not supported on baseKey ${baseKey}`);
        }
        return await match.store.createAsync(match.scopedKey,primaryKey,value,cancel);
    }

    public async createNoReturnAsync<TK extends T=T>(
        baseKey:string,
        primaryKey:(keyof TK)|null|undefined,
        value:Partial<TK>,cancel?:CancelToken)
        :Promise<void>
    {
        if(baseKey.startsWith('/')){
            baseKey=baseKey.substring(1);
        }

        const match=this.getRouteMatch(baseKey,'create');
        if(!match?.store.createNoReturnAsync){
            await this.createAsync(baseKey,primaryKey,value,cancel);
            return;
        }
        await match.store.createNoReturnAsync(match.scopedKey,primaryKey,value,cancel);
    }

    public async deleteAsync(key:string,cancel?:CancelToken):Promise<boolean|undefined>
    {
        if(key.startsWith('/')){
            key=key.substring(1);
        }

        const match=this.getRouteMatch(key,'delete');
        if(!match?.store.deleteAsync){
            return false;
        }

        return await match.store.deleteAsync(match.scopedKey,cancel);
    }

    public async queryAsync<TK extends T=T>(baseKey:string,query:Query,cancel?:CancelToken):Promise<TK[]>
    {
        if(baseKey.startsWith('/')){
            baseKey=baseKey.substring(1);
        }

        const match=this.getRouteMatch(baseKey,'query');
        if(!match?.store.queryAsync){
            return [];
        }

        return await match.store.queryAsync(match.scopedKey,query,cancel);
    }

    public watch<TK extends T=T>(key:string):ValuePointer<TK>|undefined
    {
        if(key.startsWith('/')){
            key=key.substring(1);
        }

        const match=this.getRouteMatch(key,'watch');
        if(!match?.store.watch){
            return undefined;
        }

        return match.store.watch(match.scopedKey);
    }

    public watchQuery<TK extends T=T>(baseKey:string,query:Query):ListPointer<TK>|undefined
    {
        if(baseKey.startsWith('/')){
            baseKey=baseKey.substring(1);
        }

        const match=this.getRouteMatch(baseKey,'watchQuery');
        if(!match?.store.watchQuery){
            return undefined;
        }

        return match.store.watchQuery(match.scopedKey,query);
    }


}


