import { delayAsync, unused } from "./common-lib";
import { HashMap } from "./common-types";
import { HttpBaseUrlPrefixNotFoundError } from "./errors";
import { BaseHttpRequest, HttpClientRequestOptions, HttpFetcher, HttpMethod, HttpRequestSigner } from "./http-types";
import { HttpFetchers, HttpRequestSigners, apiBaseUrlParam, httpBaseUrlMapParam, httpBaseUrlPrefixParam, httpLogRequestsParam, httpLogResponsesParam, httpMaxRetriesParam, httpRetryDelayMsParam } from "./http.deps";
import { JwtProvider } from "./jwt";
import { JwtProviders } from "./jwt.deps";
import { deleteUndefined } from "./object";
import { Scope, TypeDef } from "./scope-types";
import { getUriProtocol } from "./uri";

export interface HttpClientOptions
{
    baseUrlMap?:HashMap<string>;

    signers?:TypeDef<HttpRequestSigner>;

    fetchers?:TypeDef<HttpFetcher>;

    baseUrlPrefix?:string;

    jwtProviders?:TypeDef<JwtProvider>;

    logRequests?:boolean;

    logResponses?:boolean;

    maxRetries?:number;

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

    public async requestAsync<T>(
        method:HttpMethod,
        uri:string,
        body?:any,
        {
            autoLocale=true,
            returnUndefinedFor404=true,
            returnFetchResponse=false,
            parseResponse=true,
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

        const jwt=this.options.jwtProviders?.getFirst(null,p=>p(uri));

        const baseRequest:BaseHttpRequest={
            uri,
            method,
            body:body===undefined?undefined:JSON.stringify(body),
            headers:deleteUndefined<any>({
                "Authorization":jwt?'Bearer '+jwt:undefined,
                "Content-Type":body?'application/json':undefined,
            })
        }

        if(getUriProtocol(uri)){
            const signer=this.options.signers?.getFirst(null,p=>p.canSign(baseRequest)?p:undefined);
            if(signer){
                await signer.sign(baseRequest);
            }
        }

        const fetcher=this.options.fetchers?.getFirst(null,p=>p.canFetch(baseRequest)?p:undefined);
        if(!fetcher){
            throw new Error('No HttpFetcherType found');
        }

        const maxTries=this.options.maxRetries??1;

        let response:Response|undefined;

        for(let t=0;t<maxTries;t++){
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


    public async getAsync<T>(uri:string,options?:HttpClientRequestOptions):Promise<T|undefined>
    {
        return await this.requestAsync<T>('GET',uri,undefined,options);
    }

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

    public async postAsync<T>(uri:string,body:any,options?:HttpClientRequestOptions):Promise<T|undefined>
    {
        return await this.requestAsync<T>('POST',uri,body,options);
    }

    public async patchAsync<T>(uri:string,body:any,options?:HttpClientRequestOptions):Promise<T|undefined>
    {
        return await this.requestAsync<T>('PATCH',uri,body,options);
    }

    public async putAsync<T>(uri:string,body:any,options?:HttpClientRequestOptions):Promise<T|undefined>
    {
        return await this.requestAsync<T>('PUT',uri,body,options);
    }

    public async deleteAsync<T>(uri:string,options?:HttpClientRequestOptions):Promise<T|undefined>
    {
        return await this.requestAsync<T>('DELETE',uri,undefined,options);
    }
}
