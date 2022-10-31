import { CancelToken, DependencyContainer, DisposedError, ListPointer, Query, UnsupportedError, ValuePointer } from "@iyio/common";
import { isKeyStoreScopeMatch } from "./key-value-store-lib";
import { CreateKeyValueResult, IKeyValueStore, KeyValueStoreMatch, KeyValueStoreOp, KeyValueStoreOpMethods, KeyValueStoreProvider } from "./key-value-store-types";

interface StoreRoute
{
    path:string;
    depId?:symbol;
    provider?:KeyValueStoreProvider;
    create?:(deps:DependencyContainer)=>IKeyValueStore;
    store?:IKeyValueStore;
}

/**
 * RouteStore routes request to child stores
 */
export class RouterStore implements IKeyValueStore, Required<KeyValueStoreOpMethods>
{

    private readonly routes:StoreRoute[]=[];

    private readonly deps:DependencyContainer;


    private _isDisposed=false;
    public get isDisposed(){return this._isDisposed}

    public constructor(deps:DependencyContainer)
    {
        this.deps=deps;
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


    public mount(path:string,provider:IKeyValueStore|KeyValueStoreProvider|((deps:DependencyContainer)=>IKeyValueStore),depId?:symbol)
    {

        if(path.startsWith('/')){
            path=path.substring(1);
        }

        if(path && !path.endsWith('/')){
            path+='/';
        }

        if((provider as Partial<KeyValueStoreProvider>).providerType){
            this.routes.push({
                path,
                depId,
                provider:provider as KeyValueStoreProvider
            });
        }else if(typeof provider === 'function'){
            this.routes.push({
                path,
                depId,
                create:provider
            })
        }else{
            this.routes.push({
                path,
                depId,
                store: provider
            });
        }
    }

    public getRouteMatch(key:string,op?:KeyValueStoreOp):KeyValueStoreMatch|undefined
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
                if(route.create){
                    route.store=route.create(this.deps);
                }else if(route.provider && isKeyStoreScopeMatch(routeKey,route.provider,op)){
                    route.store=this.deps.get(route.provider.providerType);
                }
            }

            if(route.store){
                const scopedKey=isKeyStoreScopeMatch(routeKey,route.store,op);
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

    public requireRouteMatch(key:string,op?:KeyValueStoreOp):KeyValueStoreMatch
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

    public async getAsync<T>(key:string,cancel?:CancelToken):Promise<T|undefined>
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

    public supports(key:string,op:KeyValueStoreOp):boolean{
        if(key.startsWith('/')){
            key=key.substring(1);
        }

        return this.getRouteMatch(key,op)?true:false;
    }

    public async putAsync<T>(key:string, value:T,cancel?:CancelToken):Promise<T>
    {
        if(key.startsWith('/')){
            key=key.substring(1);
        }

        const match=this.getRouteMatch(key,'put');
        if(!match?.store.putAsync){
            throw new UnsupportedError(`put is not supported on key ${key}`);
        }

        return await match.store.putAsync(match.scopedKey,value,cancel);
    }

    public async patchAsync<T>(key:string,value:Partial<T>,cancel?:CancelToken):Promise<T>
    {
        if(key.startsWith('/')){
            key=key.substring(1);
        }

        const match=this.getRouteMatch(key,'patch');
        if(!match?.store.patchAsync){
            throw new UnsupportedError(`patch is not supported on key ${key}`);
        }

        return await match.store.patchAsync(match.scopedKey,value,cancel);
    }

    public async createAsync<T>(
        baseKey:string,
        primaryKey:(keyof T)|null|undefined,
        value:Partial<T>,cancel?:CancelToken)
        :Promise<CreateKeyValueResult<T>>
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

    public async createNoReturnAsync<T>(
        baseKey:string,
        primaryKey:(keyof T)|null|undefined,
        value:Partial<T>,cancel?:CancelToken)
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

    public async queryAsync<T>(baseKey:string,query:Query,cancel?:CancelToken):Promise<T[]>
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

    public watch<T>(key:string):ValuePointer<T>|undefined
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

    public watchQuery<T>(baseKey:string,query:Query):ListPointer<T>|undefined
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


