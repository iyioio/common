import { BaseHttpRequest, HttpFetcher } from "./http-types";

export class HttpDefaultFetcher implements HttpFetcher
{
    canFetch(){
        return typeof globalThis.fetch !== 'undefined';
    }
    fetchAsync(request:BaseHttpRequest):Promise<Response>{
        const uri=request.uri;
        delete (request as any).uri;
        return globalThis.fetch(uri,request);
    }
};
