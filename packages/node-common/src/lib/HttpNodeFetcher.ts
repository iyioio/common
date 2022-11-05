import { BaseHttpRequest, HttpFetcher } from "@iyio/common";
import fetch from 'node-fetch';

export class HttpNodeFetcher implements HttpFetcher
{
    canFetch(){
        return true;
    }
    fetchAsync(request:BaseHttpRequest):Promise<Response>{
        const uri=request.uri;
        delete (request as any).uri;
        return fetch(uri,request) as any;
    }
};
