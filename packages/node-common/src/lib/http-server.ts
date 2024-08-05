import { BaseError, asArrayItem, getContentType, getErrorMessage, queryParamsToObject } from "@iyio/common";
import { pathExistsAsync } from "@iyio/node-common";
import { createReadStream } from "fs";
import { createServer } from "http";
import { Readable } from "node:stream";
import { join } from "path";
import { HttpRoute, defaultHttpServerPort, getHttpRoute, isHttpHandlerResult } from "./http-server-lib";

const defaultCorsHeaders:Record<string,string>={
    "Access-Control-Allow-Origin":"*",
    "Access-Control-Allow-Headers":"*",
    "Access-Control-Allow-Methods":"OPTIONS,GET,PUT,POST,DELETE,PATCH,HEAD",
    "Access-Control-Max-Age":"86400",
    "Access-Control-Allow-Credentials":"true",
}


export interface HttpServerOptions
{
    port?:number;
    baseDir?:string;
    displayUrl?:string;
    routes:HttpRoute[];
    removeApiFromPathStart?:boolean;
    serverName?:string;
}
export const createHttpServer=({
    port=defaultHttpServerPort,
    baseDir='www',
    displayUrl,
    removeApiFromPathStart,
    routes,
    serverName='api server'
}:HttpServerOptions)=>{
    createServer(async (req,res)=>{
        let path=(req.url??'/');
        if(!path.startsWith('/')){
            path='/'+path;
        }
        if(removeApiFromPathStart && path.startsWith('/api')){
            path=path.substring(4);
            if(!path.startsWith('/')){
                path='/'+path;
            }
        }
        console.info(`request ${path}, pid:${process.pid}`);
        const qi=path.indexOf('?');
        const query:Record<string,string>=qi===-1?{}:queryParamsToObject(path.substring(qi));
        if(qi!==-1){
            path=path.substring(0,qi);
        }
        const filepath=join(baseDir,path.replace(/^\//,'').replace(/\/\.{2,}\//g,'/_/'));
        const method=req.method??'GET';
        let html:string|undefined;
        let markdown:string|undefined;
        let text:string|undefined;
        let json:any;
        let outPath:string|undefined;
        let stream:Readable|undefined;
        let keepStreamOpen:boolean|undefined;
        let outSize:number=0;
        let contentType:string|undefined;

        for(const e in defaultCorsHeaders){
            res.setHeader(e,defaultCorsHeaders[e]??'');
        }

        if(method==='OPTIONS'){
            res.statusCode=204;
            res.end();
            return;
        }

        try{
            const route=getHttpRoute(path,method,routes);
            if(route){
                const regex=asArrayItem(route.match);
                if(regex){
                    const match=regex.exec(path);
                    if(match){
                        for(let i=1;i<match.length;i++){
                            const value=match[i];
                            query[i.toString()]=value??'';

                        }
                    }
                }
                let body:any=undefined;
                if(!route.rawBody && req.readable && (req.method==='POST' || req.method==='PUT')){
                    body=await new Promise<any>((resolve,reject)=>{
                        let chunk:any;
                        //todo - use something other than a string
                        let data='';
                        req.on('readable',()=>{
                            while((chunk=req.read())){
                                data+=chunk?.toString?.()??'';
                            }
                        })
                        req.on('end',()=>{
                            try{
                                resolve(data?JSON.parse(data):null)
                            }catch(ex){
                                reject(ex);
                            }
                        })
                        req.on('error',reject);
                    })
                }
                const result=await route.handler({
                    req,
                    res,
                    path,
                    filePath:filepath,
                    body,
                    method,
                    query
                });
                if(isHttpHandlerResult(result)){
                    json=result.json;
                    html=result.html;
                    markdown=result.markdown;
                    text=result.text;
                    outPath=result.filePath;
                    stream=result.stream;
                    keepStreamOpen=result.keepStreamOpen;
                    contentType=result.contentType;
                    if(result.size){
                        outSize=result.size;
                    }
                }else{
                    json=result;
                }
            }else{
                res.setHeader('Content-Type','text/plain');
                res.statusCode=404;
                res.end('404');
                return;
            }
        }catch(ex){
            let code=500;
            if(ex instanceof BaseError){
                code=ex.cErrT||500;
            }
            console.error(`Request error - ${path}`,ex);
            res.setHeader('Content-Type','text/plain');
            res.statusCode=code;
            res.end(getErrorMessage(ex)+'\n\n\n'+(ex as any)?.stack)
            return;
        }
        if(html){
            res.setHeader('Content-Type',contentType??'text/html');
            res.statusCode=200;
            res.end(html);
        }else if(markdown){
            res.setHeader('Content-Type',contentType??'text/markdown');
            res.statusCode=200;
            res.end(markdown);
        }else if(text){
            res.setHeader('Content-Type',contentType??'text/plain');
            res.statusCode=200;
            res.end(text);
        }else if(json!==undefined){
            res.setHeader('Content-Type',contentType??'application/json');
            req.statusCode=200;
            let text:string='null';
            try{
                text=JSON.stringify(json);
            }catch(ex){
                text=JSON.stringify(getErrorMessage(ex));
            }
            res.end(text);
        }else if(stream){
            res.statusCode=200;
            res.setHeader('Content-type',contentType??'text/plain');
            if(outSize){
                res.setHeader('Content-Length',outSize.toString());
            }
            stream.on('error',err=>{
                if(!keepStreamOpen){
                    stream?.destroy();
                }
                res.end(getErrorMessage(err));
            });
            stream.on('end',()=>{
                if(!keepStreamOpen){
                    stream?.destroy();
                }
            })
            stream.pipe(res);
        }else if(outPath && await pathExistsAsync(outPath)){

            res.statusCode=200;
            const fileStream=createReadStream(outPath);
            fileStream.on('open',()=>{
                res.setHeader('Content-type',contentType??getContentType(outPath));
                if(outSize){
                    res.setHeader('Content-Length',outSize.toString());
                }
                fileStream.pipe(res);
            })
            fileStream.on('error',err=>{
                fileStream.destroy();
                res.setHeader('Content-type','text/plain');
                res.end(getErrorMessage(err));
            });
            fileStream.on('end',()=>{
                fileStream.destroy();
            })
        }else{
            res.setHeader('Content-Type','text/plain');
            res.statusCode=404;
            res.end('404');
        }
    }).listen({
        port,
        exclusive:false,
    });
    console.info(`${serverName} listening on port ${port} - ${displayUrl||`http://localhost:${port}`}`);
}
