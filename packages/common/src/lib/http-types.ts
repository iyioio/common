export type HttpMethod='GET'|'POST'|'PUT'|'PATCH'|'DELETE'|'OPTIONS';

export interface BaseHttpRequest
{
    method:HttpMethod,
    uri:string,
    path?:string;
    body?:any,
    headers?:{[name:string]:string};
}

export interface HttpRequestSigner
{
    canSign(request:BaseHttpRequest):boolean;

    sign(request:BaseHttpRequest):Promise<void>|void;
}



export interface HttpClientRequestOptions
{
    /**
     * If true the Accept-Language and locale query value will be set to the current locale.
     * @default true
     */
    autoLocale?:boolean;

    /**
     * If true and the call returns a 404 undefined will be returned instead of throwing and error.
     * @default true
     */
    returnUndefinedFor404?:boolean;

    /**
     * If true the raw fetch response will be returned.
     * @default false
     */
    returnFetchResponse?:boolean;

    /**
     * If true the result of the response will be parsed and returned.
     * @default true
     */
    parseResponse?:boolean;
}

export interface HttpFetcher{

    canFetch(request:BaseHttpRequest):boolean;

    fetchAsync(request:BaseHttpRequest):Promise<Response>;
}
