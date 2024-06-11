import { readdir } from "fs/promises";
import { CreateWebCrawlerOutputPreviewerOptions, createWebCrawlerOutputPreviewer } from "./convo-web-crawler-output-previewer";

export const writeConvoCrawlerPreviewAsync=async (dir:string,options?:Partial<CreateWebCrawlerOutputPreviewerOptions>)=>{

    if(dir.endsWith('/')){
        dir=dir.substring(0,dir.length-1);
    }
    const parts=dir.split('/');
    const baseDir=parts[parts.length-1]??'';

    const files=(await readdir(dir)).filter(f=>!f.toLowerCase().endsWith('.html'));

    const html=createWebCrawlerOutputPreviewer({
        ...options,
        baseDir,
        files,
        fileAction:'load-file'
    });

    return html;

}

export const writeConvoCrawlerIndexAsync=async (dir:string,options?:Partial<CreateWebCrawlerOutputPreviewerOptions>)=>{

    if(dir.endsWith('/')){
        dir=dir.substring(0,dir.length-1);
    }
    const parts=dir.split('/');
    const baseDir=parts[parts.length-1]??'';

    const files=(await readdir(dir,{withFileTypes:true}))
        .filter(f=>f.isDirectory())
        .map(f=>f.name);

    const html=createWebCrawlerOutputPreviewer({
        ...options,
        baseDir,
        files,
        fileAction:'link',
        wideLinks:true
    });

    return html;

}
