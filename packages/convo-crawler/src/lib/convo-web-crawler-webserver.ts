import { getContentType, getErrorMessage } from "@iyio/common";
import { Stats, createReadStream } from "fs";
import { stat } from "fs/promises";
import { createServer } from "http";
import { basename, join } from "path";
import { writeConvoCrawlerIndexAsync, writeConvoCrawlerPreviewAsync } from "./convo-web-crawler-output-previewer-writer";

export const defaultConvoCrawlerWebServerPort=8899;
export interface ConvoCrawlerWebServerOptions
{
    port?:number;
    baseDir?:string;
    displayUrl?:string;
}
export const runConvoCrawlerWebServer=({
    port=defaultConvoCrawlerWebServerPort,
    baseDir='convo-crawler-out',
    displayUrl
}:ConvoCrawlerWebServerOptions)=>{
    createServer(async (req,res)=>{
        const url=(req.url??'/');
        const filepath=join(baseDir,url.replace(/^\//,'').replace(/\/\.{2,}\//g,'/_/'));
        console.info(`request ${url} -> ${filepath}`)
        let html:string|undefined;
        let json:any;
        let outPath:string|undefined;
        let outSize:number=0;
        try{
            if(url==='/' || url==='index.html'){
                html=await writeConvoCrawlerIndexAsync(filepath);
            }else{
                let s:Stats|undefined;
                try{
                    s=await stat(filepath);
                }catch{
                    //
                }
                if(s){
                    if(s.isDirectory()){
                        html=await writeConvoCrawlerPreviewAsync(filepath,{
                            back:true,
                            title:basename(filepath),
                        });
                    }else if(s.isFile() || s.isSymbolicLink()){
                        outPath=filepath;
                        outSize=s.size;
                    }
                }
            }
        }catch(ex){
            res.setHeader('Content-Type','text/plain');
            res.statusCode=500;
            res.end(getErrorMessage(ex)+'\n\n\n'+(ex as any)?.stack)
            return;
        }
        if(html){
            res.setHeader('Content-Type','text/html');
            res.statusCode=200;
            res.end(html);
        }else if(json!==undefined){
            res.setHeader('Content-Type','application/json');
            req.statusCode=200;
            let text:string='null';
            try{
                text=JSON.stringify(json);
            }catch(ex){
                text=JSON.stringify(getErrorMessage(ex));
            }
            res.end(text);
        }else if(outPath){

            res.statusCode=200;
            const stream=createReadStream(outPath);
            stream.on('open',()=>{
                res.setHeader('Content-type',getContentType(outPath));
                if(outSize){
                    res.setHeader('Content-Length',outSize.toString());
                }
                stream.pipe(res);
            })
            stream.on('error',err=>{
                res.setHeader('Content-type','text/plain');
                res.end(getErrorMessage(err));
            });
        }else{
            res.setHeader('Content-Type','text/plain');
            res.statusCode=404;
            res.end('404');
        }
    }).listen(port);
    console.info(`convo crawler listening on port ${port} - ${displayUrl||`http://localhost:${port}`}`);
}
