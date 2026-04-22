export const allHttpMethods=['GET','POST','PUT','PATCH','DELETE','OPTIONS'] as const;

export type HttpMethod=typeof allHttpMethods[number];

export interface BaseHttpRequest
{
    method:HttpMethod;
    uri:string;
    path?:string;
    body?:any;
    headers?:Record<string,string>;
}

export interface HttpSseRequest extends Omit<HttpClientRequestOptions,'returnFetchResponse'>
{
    method?:HttpMethod;
    url:string;
    body?:any;
    dataAsString?:boolean;
    logStreamErrors?:boolean;
    /**
     * When the data value of a SSE is equal to `endDataFlag` streaming will end before
     * the connection is closed.
     */
    endDataFlag?:string;
}

export interface ServerSentEvent<T=any>
{
    event?:string;
    id?:string;
    retry?:number;
    data?:T;
    error?:{message:string,error:any}
    [field:string]:any;
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

    /**
     * If true the body object of the request will be converted into a URL encoded form body
     */
    urlEncodeBody?:boolean;

    /**
     * If true the body object will be converted to a FormData instance.
     */
    convertBodyToFormData?:boolean;

    noAuth?:boolean;

    /**
     * Additional headers to add to the request. Null and undefined key pairs will be ignored.
     * If supplied the default headers created by HttpClient will be ignored.
     */
    headers?:Record<string,string|null|undefined>;

    /**
     * If true and headers are provided then the default headers created by HttpClient will also
     * be used.
     */
    includeDefaultHeadersWithHeaders?:boolean;

    /**
     * If true information about the response is logged.
     */
    log?:boolean;

    /**
     * If true error status codes are ignored
     */
    ignoreErrors?:boolean;

    /**
     * If true body should be passed directly
     */
    rawBody?:boolean;

    /**
     * The max number of times the request should be retired in the case of an error
     * @default 5
     */
    maxRetries?:number;

    /**
     * If true error responses will be read and added to throw errors
     */
    readErrors?:boolean;
}

export interface HttpFetcher{

    canFetch(request:BaseHttpRequest):boolean;

    fetchAsync(request:BaseHttpRequest):Promise<Response>;
}
