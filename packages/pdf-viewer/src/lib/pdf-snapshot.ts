import { Lock } from "@iyio/common";
import { pdfReaderPool } from "./PdfReaderPool.js";

const runLock=new Lock(1);

const cacheTtl=30000;

export const getPdfSnapshotAsync=async (urlOrFile:string|File,pageIndex=0,format='image/jpeg',allowParallel?:boolean)=>{
    if(urlOrFile instanceof File){
        return getSnapAsync(urlOrFile,pageIndex,format);
    }else if(allowParallel){
        return await getCachedSnapAsync(urlOrFile,pageIndex,format);
    }else{
        const release=await runLock.waitAsync();
        try{
            return await getCachedSnapAsync(urlOrFile,pageIndex,format);
        }finally{
            release();
        }
    }
}

const cache:Record<string,Promise<Blob|undefined>>={};

const getCachedSnapAsync=async (url:string,pageIndex:number,format:string):Promise<Blob|undefined>=>{
    const key=`${pageIndex}:${format}:${url}`;
    const match=cache[key];
    if(match){
        return await match;
    }
    const p=getSnapAsync(url,pageIndex,format);
    cache[key]=p;
    setTimeout(()=>{
        if(cache[key]===p){
            delete cache[key];
        }
    },cacheTtl);
    return await p;
}

const getSnapAsync=async (urlOrFile:string|File,pageIndex:number,format:string):Promise<Blob|undefined>=>{
    const reader=pdfReaderPool().getReader(urlOrFile);
    try{

        const blob=await reader.pageToImageAsync(pageIndex,format);
        return blob??undefined;

    }finally{
        pdfReaderPool().returnReader(reader);
    }
}
