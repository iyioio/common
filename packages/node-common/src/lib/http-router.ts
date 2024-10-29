import { BaseError, asArrayItem, getContentType, getErrorMessage, getUriProtocol, joinPaths, queryParamsToObject } from "@iyio/common";
import { HttpRouterRequest, HttpServerOptions, getHttpRoute, isHttpHandlerResult, pathExistsAsync } from "@iyio/node-common";
import { createReadStream } from "fs";
import { ServerResponse } from "http";
import { Readable } from "node:stream";
import { join } from "path";

const defaultCorsHeaders:Record<string,string>={
    "Access-Control-Allow-Origin":"*",
    "Access-Control-Allow-Headers":"*",
    "Access-Control-Allow-Methods":"OPTIONS,GET,PUT,POST,DELETE,PATCH,HEAD",
    "Access-Control-Max-Age":"86400",
    "Access-Control-Allow-Credentials":"true",
}


export const createHttpRouter=({
    baseDir='www',
    removeApiFromPathStart,
    routes,
    hostname,
    addHostToRedirects,
    https,
}:HttpServerOptions):((req:HttpRouterRequest,res:ServerResponse)=>Promise<void>)=>{
    return async (req:HttpRouterRequest,res:ServerResponse)=>{
        const method=req.method??'GET';
        let path=req.url??'/';
        if(!path.startsWith('/')){
            path='/'+path;
        }
        if(removeApiFromPathStart && path.startsWith('/api')){
            path=path.substring(4);
            if(!path.startsWith('/')){
                path='/'+path;
            }
        }
        console.info(`request ${method}:${path}, pid:${process.pid}`);
        const qi=path.indexOf('?');
        const query:Record<string,string>=qi===-1?{}:queryParamsToObject(path.substring(qi));
        if(qi!==-1){
            path=path.substring(0,qi);
        }
        const filepath=join(baseDir,path.replace(/^\//,'').replace(/\/\.{2,}\//g,'/_/'));
        let html:string|undefined;
        let markdown:string|undefined;
        let text:string|undefined;
        let json:any;
        let outPath:string|undefined;
        let stream:Readable|undefined;
        let buffer:Buffer|Uint8Array|string|undefined;
        let keepStreamOpen:boolean|undefined;
        let outSize:number=0;
        let contentType:string|undefined;
        let redirect:string|undefined;
        let statusCode:number|undefined;

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
                            query[i.toString()]=decodeURIComponent(value??'');

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
                }else if(req.body!==undefined){
                    body=req.body;
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
                    buffer=result.buffer;
                    text=result.text;
                    outPath=result.filePath;
                    stream=result.stream;
                    keepStreamOpen=result.keepStreamOpen;
                    contentType=result.contentType;
                    redirect=result.redirect;
                    statusCode=result.statusCode;
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
        if(redirect!==undefined){
            if(addHostToRedirects && !getUriProtocol(redirect)){
                const host=hostname || req.headers['host'] || req.headers['Host'];
                if(host){
                    redirect=joinPaths(`${(host==='localhost' && https===undefined)?'http':https===false?('http'):'https'}://${host}`,redirect);
                }
            }
            res.setHeader('Location',redirect);
            res.statusCode=statusCode??301;
            res.end();
        }else if(html){
            res.setHeader('Content-Type',contentType??'text/html');
            res.statusCode=statusCode??200;
            res.end(html);
        }else if(markdown){
            res.setHeader('Content-Type',contentType??'text/markdown');
            res.statusCode=statusCode??200;
            res.end(markdown);
        }else if(text){
            res.setHeader('Content-Type',contentType??'text/plain');
            res.statusCode=statusCode??200;
            res.end(text);
        }else if(json!==undefined){
            res.setHeader('Content-Type',contentType??'application/json');
            res.statusCode=statusCode??200;
            let text:string='null';
            try{
                text=JSON.stringify(json);
            }catch(ex){
                text=JSON.stringify(getErrorMessage(ex));
            }
            res.end(text);
        }else if(buffer){
            res.statusCode=statusCode??200;
            res.setHeader('Content-type',contentType??'text/plain');
            res.end(buffer);
        }else if(stream){
            res.statusCode=statusCode??200;
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

            res.statusCode=statusCode??200;
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
            res.statusCode=statusCode??404;
            res.end('404');
        }
    }
}
