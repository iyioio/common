const sharedCached:{[key:string]:any}={};

export interface PromiseCacheOptions<TItem,TLookup>
{
    getItemAsync:(lookup:TLookup)=>Promise<TItem>;

    getKey?:(lookup:TLookup)=>string;

    sharedCacheKey?:string;
}

export class PromiseCache<TItem,TLookup>
{
    private readonly cache:{[key:string]:Promise<TItem>};

    private readonly _getItemAsync:(lookup:TLookup)=>Promise<TItem>;

    private readonly _getKey:(lookup:TLookup)=>string;

    public readonly sharedCacheKey:string|undefined;

    public get hasSharedCache(){return this.sharedCacheKey?true:false}

    public constructor({
        getKey,
        getItemAsync,
        sharedCacheKey
    }:PromiseCacheOptions<TItem,TLookup>)
    {
        this.sharedCacheKey=sharedCacheKey||undefined;
        if(sharedCacheKey){
            if(!sharedCached[sharedCacheKey]){
                sharedCached[sharedCacheKey]={}
            }
            this.cache=sharedCached[sharedCacheKey];
        }else{
            this.cache={}
        }
        this._getItemAsync=getItemAsync;
        this._getKey=getKey??((lookup:any):string=>lookup?.toString??'');
    }

    public async getItemAsync(lookup:TLookup):Promise<TItem>
    {
        const key=this._getKey(lookup);
        let p=this.cache[key];
        if(p){
            return p;
        }

        p=this._getItemAsync(lookup);
        this.cache[key]=p;
        return await p;
    }

    public getKey(lookup:TLookup):string
    {
        return this._getKey(lookup);
    }

    public removeFromCache(lookup:TLookup)
    {
        delete this.cache[this._getKey(lookup)];
    }

    public isInCache(lookup:TLookup):boolean
    {
        return this.cache[this._getKey(lookup)]!==undefined;
    }
}

export class PromiseCacheStr<TItem> extends PromiseCache<TItem,string>
{
    public constructor({
        getKey=(key)=>key,
        getItemAsync: getter,
        sharedCacheKey
    }:PromiseCacheOptions<TItem,string>)
    {
        super({getKey,getItemAsync: getter,sharedCacheKey});
    }
}