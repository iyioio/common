import { HttpRequestContextBase, HttpRouteBase, asArray } from "@iyio/common";
import { IncomingMessage, ServerResponse } from "http";
import { Readable } from "node:stream";

export const httpResultFlag=Symbol('httpServerResultFlag');

export const defaultHttpServerPort=8080;

export interface HttpHandlerResult
{
    [httpResultFlag]:true;
    html?:string;
    markdown?:string;
    text?:string;
    filePath?:string;
    json?:any;
    stream?:Readable;
    keepStreamOpen?:boolean;
    contentType?:string;
    size?:number;
    redirect?:string;
    statusCode?:number;
}

export interface HttpRequestContext extends HttpRequestContextBase
{
    req:IncomingMessage;
    res:ServerResponse;
}

export interface HttpRoute extends HttpRouteBase
{
    path?:string|string[];
    match?:RegExp|RegExp[];
    method?:string|string[];
    handler:(ctx:HttpRequestContext)=>any|Promise<any>;
    rawBody?:boolean;
}

export const isHttpHandlerResult=(value:any):value is HttpHandlerResult=>{
    return value?.[httpResultFlag]===true;
}

export const createHttpHandlerResult=(result:Omit<HttpHandlerResult,typeof httpResultFlag>):HttpHandlerResult=>{
    return {
        [httpResultFlag]:true,
        ...result
    }
}


export const getHttpRoute=(path:string,method:string,routes:HttpRoute[]):HttpRoute|undefined=>{
    for(const route of routes){
        if(route.method!==undefined){
            if(Array.isArray(route.method)){
                if(!route.method.includes(method)){
                    continue;
                }
            }else if(route.method!==method){
                continue;
            }
        }
        if(route.path){
            const lp=path.toLowerCase();
            const ary=asArray(route.path);
            for(const p of ary){
                if(p===lp){
                    return route;
                }
            }
        }
        if(route.match){
            const ary=asArray(route.match);
            for(const m of ary){
                if(m.test(path)){
                    return route;
                }
            }
        }
    }
    return undefined;
}


