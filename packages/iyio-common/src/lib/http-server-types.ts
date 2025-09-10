import { HashMap } from "./common-types.js";
import { BaseHttpRequest } from "./http-types.js";

export type RouteHandler=(request:BaseHttpRequest,body:any,sourceEvent:HttpRequestEventVariations)=>Promise<any>|any;

export interface RouteConfig
{
    basePath?:string;
    pathCapture?:RegExp;
    pathCaptureIndex?:number;
    requirePathCapture?:boolean;
    logRequest?:boolean;

    /**
     * If true the handler will return an object that implements the HttpResponse interface.
     */
    returnsHttpResponse?:boolean;

    /**
     * If true CORS headers will be returned;
     */
    cors?:boolean;

    responseDefaults?:HttpResponseOptions;
}

export interface HttpResponseOptions
{
    statusCode?:number;
    headers?:HashMap<string|undefined>;
    serverName?:string;
    contentType?:string;
    body?:string;
    cors?:boolean;
    isBase64Encoded?:boolean;
}

export interface HttpResponse
{
    statusCode:number;
    headers:HashMap<string>;
    body?:string;
    isBase64Encoded?:boolean;
}

export interface RouteMap{
    [path:string]:RouteHandler;
}

export interface HttpRequestEventVariations
{
    queryStringParameters?:{[key:string]:string};
    requestContext?:{
        http?:{
            path?:string;
            method?:string;
        },
        path?:string;
        httpMethod?:string;
    }
    body?:any;
}
