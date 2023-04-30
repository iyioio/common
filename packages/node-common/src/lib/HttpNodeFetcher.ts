import { BaseHttpRequest, HttpFetcher } from "@iyio/common";

let _fetch:any=null;

export class HttpNodeFetcher implements HttpFetcher
{
    canFetch(){
        return true;
    }
    async fetchAsync(request:BaseHttpRequest):Promise<Response>{

        if(!_fetch){
            _fetch=globalThis.fetch??(await import('node-fetch')).default;
        }

        const uri=request.uri;
        delete (request as any).uri;
        return await _fetch(uri,request) as any;
    }
};
