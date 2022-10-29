import { DependencyContainer, deps, DisposedError, ListPointer, Query, ValuePointer } from "@iyio/common";
import { IKeyValueStoreProvider, KeyStoreProviderRef, KeyValueStoreFilter, KeyValueStoreOp, KeyValueStoreProviderMatch } from "./key-value-store-types";

interface Provider
{
    ref?:KeyStoreProviderRef;
    provider?:IKeyValueStoreProvider;
}

export class KeyValueStore implements IKeyValueStoreProvider
{

    private readonly providers:Provider[]=[];

    private readonly depsContainer:DependencyContainer;


    private _isDisposed=false;
    public get isDisposed(){return this._isDisposed}

    public constructor(depsContainer:DependencyContainer=deps)
    {
        this.depsContainer=depsContainer;
    }

    public dispose()
    {
        if(this._isDisposed){
            return;
        }

        this._isDisposed=true;

        for(const p of this.providers){
            p.provider?.dispose?.();
        }
    }


    public registerProvider(provider:IKeyValueStoreProvider|KeyStoreProviderRef)
    {
        if((provider as Partial<KeyStoreProviderRef>).providerType){
            this.providers.push({
                ref:provider as KeyStoreProviderRef
            });
        }else{
            this.providers.push({
                provider
            });
        }
    }

    public getProviderMatch(key:string,op?:KeyValueStoreOp):KeyValueStoreProviderMatch|undefined
    {
        if(this._isDisposed){
            throw new DisposedError('KeyStore disposed');
        }

        for(const p of this.providers){

            if(p.ref && !p.provider && isKeyStoreFilterMatch(key,p.ref,op)){
                p.provider=this.depsContainer.get(p.ref.providerType);
            }

            if(p.provider){
                const nKey=isKeyStoreFilterMatch(key,p.provider,op);
                if(nKey!==false){
                    return {
                        provider:p.provider,
                        key:nKey
                    }
                }
            }
        }

        return undefined;
    }

    public requireProviderMatch(key:string,op?:KeyValueStoreOp):KeyValueStoreProviderMatch
    {
        const match=this.getProviderMatch(key,op);
        if(!match){
            throw new Error(`No provider found for key ${key}${op?` and op ${op}`:''}`)
        }
        return match;
    }

    public async getAsync<T>(key:string):Promise<T|undefined>
    {
        const match=this.getProviderMatch(key,'get');
        if(!match?.provider.getAsync){
            return undefined;
        }

        return await match.provider.getAsync(match.key);
    }

    public async putAsync<T>(key:string, item:Partial<T>):Promise<T|undefined>
    {
        const match=this.getProviderMatch(key,'put');
        if(!match?.provider.putAsync){
            return undefined;
        }

        return await match.provider.putAsync(match.key,item);
    }

    public async deleteAsync(key:string):Promise<boolean>
    {
        const match=this.getProviderMatch(key,'delete');
        if(!match?.provider.deleteAsync){
            return false;
        }

        return await match.provider.deleteAsync(match.key);
    }

    public async queryAsync<T>(key:string,query:Query):Promise<T[]>
    {
        const match=this.getProviderMatch(key,'query');
        if(!match?.provider.queryAsync){
            return [];
        }

        return await match.provider.queryAsync(match.key,query);
    }

    public watch<T>(key:string):ValuePointer<T>|undefined
    {
        const match=this.getProviderMatch(key,'watch');
        if(!match?.provider.watch){
            return undefined;
        }

        return match.provider.watch(match.key);
    }

    public watchQuery<T>(key:string,query:Query):ListPointer<T>|undefined
    {
        const match=this.getProviderMatch(key,'watchQuery');
        if(!match?.provider.watchQuery){
            return undefined;
        }

        return match.provider.watchQuery(match.key,query);
    }


}

export const isKeyStoreFilterMatch=(key:string,filter:KeyValueStoreFilter,op?:KeyValueStoreOp):string|false=>
{
    if(filter.keyBase){
        if(!filter.keyBase.startsWith(key)){
            return false;
        }
        key=key.substring(filter.keyBase.length);
    }

    if(filter.keyReg){
        const match=filter.keyReg.exec(key);
        if(!match){
            return false;
        }
        if(filter.keyRegIndex!==undefined){
            key=match[filter.keyRegIndex];
        }
    }

    if(filter.keyCondition!==undefined){
        const r=filter.keyCondition(key);
        if(r===false){
            return false;
        }
        if(r!==true){
            key=r;
        }
    }

    if(op && filter.supports?.(key,op)===false){
        return false;
    }

    return key;
}
