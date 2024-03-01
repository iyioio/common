import { delayAsync, unused } from "./common-lib";
import { HashMap } from "./common-types";
import { HttpBaseUrlPrefixNotFoundError } from "./errors";
import { encodeURIFormBody } from "./http-lib";
import { BaseHttpRequest, HttpClientRequestOptions, HttpFetcher, HttpMethod, HttpRequestSigner } from "./http-types";
import { HttpFetchers, HttpRequestSigners, apiBaseUrlParam, httpBaseUrlMapParam, httpBaseUrlPrefixParam, httpLogRequestsParam, httpLogResponsesParam, httpMaxRetriesParam, httpRetryDelayMsParam } from "./http.deps";
import { JwtProvider } from "./jwt";
import { JwtProviders } from "./jwt.deps";
import { deleteUndefined, deleteUndefinedOrNull } from "./object";
import { Scope, TypeDef } from "./scope-types";
import { getUriProtocol } from "./uri";

/**
 * Options for configuring requests sent by the HttpClient class
 */
export interface HttpClientOptions
{
    /**
     * Maps URIs prefixed to base URLs
     * @example
     * // this mapping allows URLs like `@api/messages` to be passed to the request methods of
     * // HttpClient and those request be sent to https://api.example.com/v1
     * {
     *     "api":"https://api.example.com/v1"
     * }
     */
    baseUrlMap?:HashMap<string>;

    /**
     * References to HttpRequestSigners that can sign requests. Currently used by the
     * AwsHttpRequestSigner to sign requests sent to AWS services.
     */
    signers?:TypeDef<HttpRequestSigner>;

    /**
     * References to fetchers that preference the actual HTTP request for the HttpClient class.
     * By default the global fetch function is used.
     */
    fetchers?:TypeDef<HttpFetcher>;

    /**
     * The URL prefix that a URI must start with to be remapped.
     * @default '@'
     */
    baseUrlPrefix?:string;

    /**
     * References to JwtProviders
     */
    jwtProviders?:TypeDef<JwtProvider>;

    /**
     * If true all requests are written to the console
     */
    logRequests?:boolean;

    /**
     * If true all responses are written to the console
     */
    logResponses?:boolean;

    /**
     * Max number of a request should be retired. Requests are retired in the cases of connection
     * errors or server errors (500 status codes).
     */
    maxRetries?:number;

    /**
     * Number of milliseconds to delay between request retires
     */
    retryDelay?:number;
}

export class HttpClient
{

    public static optionsFromScope(scope:Scope):HttpClientOptions{

        const apiBaseUrl=scope.to(apiBaseUrlParam).get();
        let baseUrlMap=scope.to(httpBaseUrlMapParam).get();
        if(apiBaseUrl && !baseUrlMap){
            baseUrlMap={};
        }
        if(apiBaseUrl && baseUrlMap){
            baseUrlMap={
                api:apiBaseUrl,
                ...baseUrlMap
            }
        }

        return {
            baseUrlMap,
            signers:scope.to(HttpRequestSigners),
            jwtProviders:scope.to(JwtProviders),
            fetchers:scope.to(HttpFetchers),
            baseUrlPrefix:scope.get(httpBaseUrlPrefixParam)??'@',
            logRequests:scope.get(httpLogRequestsParam),
            logResponses:scope.get(httpLogResponsesParam),
            maxRetries:scope.get(httpMaxRetriesParam),
            retryDelay:scope.get(httpRetryDelayMsParam),
        };
    }

    public static fromScope(scope:Scope):HttpClient{

        return new HttpClient(HttpClient.optionsFromScope(scope));
    }

    private readonly options:HttpClientOptions;

    public constructor(options:HttpClientOptions)
    {
        this.options={...options};
        if(!options.fetchers){
            options.fetchers=HttpFetchers;
        }
    }

    /**
     * Applies a base url to the given uri. The HttpClient can be configured to replaced URI prefixes
     * with full base URLs. For example if `@api` is configured to be replaced with `https://api.example.com/v1`
     * then passing a value of `@api/messages` to applyBaseUrl will return `https://api.example.com/v1/message`.
     * @param uri
     * @returns
     */
    public applyBaseUrl(uri:string):string{
        if( !this.options.baseUrlMap ||
            !this.options.baseUrlPrefix ||
            !uri.startsWith(this.options.baseUrlPrefix)
        ){
            return uri;
        }

        const i=uri.indexOf('/');
        const prefix=i===-1?
            uri.substring(this.options.baseUrlPrefix.length):
            uri.substring(this.options.baseUrlPrefix.length,i);

        for(const basePrefix in this.options.baseUrlMap){

            if(prefix===basePrefix){
                let base=this.options.baseUrlMap[basePrefix] as string;
                if(i===-1){
                    return base;
                }
                if(base.endsWith('/')){
                    base=base.substring(0,base.length-1);
                }
                return base+uri.substring(i);
            }

        }

        throw new HttpBaseUrlPrefixNotFoundError(`prefix = ${prefix}`);
    }

     /**
      * Sends a request to the URL. All other request methods of the HttpClient class are shorthand
      * methods of this method.
      * @param method HTTP method of the request
      * @param uri endpoint URI
      * @param body A body to send as part of the request
      * @param options additional request options
      * @returns By default the returned value from the endpoint is parsed as a JSON object and
      *          returned. You can optionally have a raw Response object returned.
      */
    public async requestAsync<T>(
        method:HttpMethod,
        uri:string,
        body?:any,
        {
            autoLocale=true,
            returnUndefinedFor404=true,
            returnFetchResponse=false,
            parseResponse=true,
            urlEncodeBody=false,
            noAuth,
            headers,
            includeDefaultHeadersWithHeaders,
        }:HttpClientRequestOptions={}):Promise<T|undefined>
    {

        unused(autoLocale);

        uri=this.applyBaseUrl(uri);

        if(this.options.logRequests){
            if(body===undefined){
                console.info(`${method} ${uri}`);
            }else{
                console.info(`${method} ${uri}`,body);
            }
        }

        const jwt=noAuth?undefined:this.options.jwtProviders?.getFirst(null,p=>p(uri));

        const maxTries=this.options.maxRetries??1;

        let response:Response|undefined;

        for(let t=0;t<maxTries;t++){
            const baseRequest:BaseHttpRequest={
                uri,
                method,
                body:body===undefined?undefined:urlEncodeBody?encodeURIFormBody(body):JSON.stringify(body),
                headers:deleteUndefined<any>((headers && !includeDefaultHeadersWithHeaders)?headers:{
                    "Authorization":jwt?'Bearer '+jwt:undefined,
                    "Content-Type":body?urlEncodeBody?'application/x-www-form-urlencoded':'application/json':undefined,
                    ...deleteUndefinedOrNull(headers)
                })
            }

            if(!noAuth && getUriProtocol(uri)){
                const signer=this.options.signers?.getFirst(null,p=>p.canSign(baseRequest)?p:undefined);
                if(signer){
                    await signer.sign(baseRequest);
                }
            }

            const fetcher=this.options.fetchers?.getFirst(null,p=>p.canFetch(baseRequest)?p:undefined);
            if(!fetcher){
                throw new Error('No HttpFetcherType found');
            }
            try{
                response=await fetcher.fetchAsync(baseRequest);

                if(returnFetchResponse){
                    return response as any;
                }

                if(response.status==404 && returnUndefinedFor404){
                    return undefined;
                }

                if(response.status>=500 && response.status<=599){
                    throw new Error(`Request failed with a status of ${response.status}. uri=${uri}`);
                }

                break;
            }catch(ex){
                if(t!==maxTries-1){
                    console.warn(`http request failed. ${t+1} of ${maxTries} attempts`,ex);
                }
            }

            await delayAsync((t+1)*(this.options.retryDelay??500));
        }

        if(!response){
            throw new Error(`Max http retries reached. max = ${maxTries}`)
        }

        if(!response.ok){
            throw new Error(`Request failed with a status of ${response.status}. uri=${uri}`)
        }

        if(!parseResponse || !response.headers.get('Content-Type')?.includes('/json')){
            return undefined;
        }

        const result=await response.json();

        if(this.options.logResponses){
            console.info(`${method} ${uri} Response:`,result);
        }

        return result;
    }

    /**
     * Sends a GET Request to the given URI and returns the result as a string instead of parsing
     * the return as a JSON object.
     * @param uri endpoint URI
     * @param options additional request options
     * @returns The value returned from the endpoint as a string. Undefined is returned in the cases of a 404.
     */
    public async getStringAsync(uri:string,options?:HttpClientRequestOptions):Promise<string|undefined>
    {
        const response=await this.requestAsync<Response>('GET',uri,undefined,{
            returnFetchResponse:true,
            ...options
        });
        if(!response){
            return undefined;
        }
        return await response.text();
    }

    /**
     * Sends a GET Request to the given URI and returns a raw Response object.
     * @param uri endpoint URI
     * @param options additional request options
     * @returns A raw Response object.
     */
    public getResponseAsync(uri:string,options?:HttpClientRequestOptions):Promise<Response|undefined>
    {
        return this.requestAsync<Response>('GET',uri,undefined,{
            returnFetchResponse:true,
            ...options
        });
    }


    /**
     * Sends a GET Request to the given URI
     * @param uri endpoint URI
     * @param options additional request options
     * @returns The value returned from the endpoint. Undefined is returned in the cases of a 404.
     */
    public async getAsync<TReturn>(uri:string,options?:HttpClientRequestOptions):Promise<TReturn|undefined>
    {
        return await this.requestAsync<TReturn>('GET',uri,undefined,options);
    }

    /**
     * Sends a POST Request to the given URI
     * @param uri endpoint URI
     * @param body The body of the request
     * @param options additional request options
     * @returns The value returned from the endpoint. Undefined is returned in the cases of a 404.
     */
    public async postAsync<TReturn,TBody=any>(uri:string,body:TBody,options?:HttpClientRequestOptions):Promise<TReturn|undefined>
    {
        return await this.requestAsync<TReturn>('POST',uri,body,options);
    }

    /**
     * Sends a PATCH Request to the given URI
     * @param uri endpoint URI
     * @param body The body of the request
     * @param options additional request options
     * @returns The value returned from the endpoint. Undefined is returned in the cases of a 404.
     */
    public async patchAsync<TReturn,TBody=any>(uri:string,body:TBody,options?:HttpClientRequestOptions):Promise<TReturn|undefined>
    {
        return await this.requestAsync<TReturn>('PATCH',uri,body,options);
    }

    /**
     * Sends a PUT Request to the given URI
     * @param uri endpoint URI
     * @param body The body of the request
     * @param options additional request options
     * @returns The value returned from the endpoint. Undefined is returned in the cases of a 404.
     */
    public async putAsync<TReturn,TBody=any>(uri:string,body:TBody,options?:HttpClientRequestOptions):Promise<TReturn|undefined>
    {
        return await this.requestAsync<TReturn>('PUT',uri,body,options);
    }

    /**
     * Sends a DELETE Request to the given URI
     * @param uri endpoint URI
     * @param options additional request options
     * @returns The value returned from the endpoint. Undefined is returned in the cases of a 404.
     */
    public async deleteAsync<TReturn>(uri:string,options?:HttpClientRequestOptions):Promise<TReturn|undefined>
    {
        return await this.requestAsync<TReturn>('DELETE',uri,undefined,options);
    }
}
