import { ValueCache } from "./ValueCache";

/**
 * Represents a client object that wraps a lower level client that is auth dependent.
 */
export abstract class AuthDependentClient<TClient>
{

    protected abstract createAuthenticatedClient():TClient;


    private readonly authServerUserDataCache:ValueCache<any>;

    public constructor(authServerUserDataCache:ValueCache<any>)
    {
        this.authServerUserDataCache=authServerUserDataCache;
    }

    protected readonly clientCacheKey=Symbol();
    public getClient():TClient{
        return this.authServerUserDataCache.getOrCreate(this.clientCacheKey,()=>this.createAuthenticatedClient())
    }

}
