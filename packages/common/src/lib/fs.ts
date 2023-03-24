import { StringOrEmpty } from "./common-types";

export const joinPaths=(... paths:string[]):string=>
{
    if(!paths){
        return '';
    }
    let path=paths[0];
    if(path.endsWith('/')){
        path=path.substring(0,path.length-1);
    }
    for(let i=1;i<paths.length;i++){
        const part=paths[i];
        if(!part){
            continue;
        }
        path+=(part[0]==='/'?'':'/')+part;
        if(path.endsWith('/')){
            path=path.substring(0,path.length-1);
        }
    }
    return path;
}


export const addDefaultProtocol=<T extends StringOrEmpty>(path:T, protocol:string='file://'):T=>
{
    if(path===null || path===undefined){
        return path;
    }
    return (path.indexOf('://')===-1?protocol+path:path) as T;
}

export const getFileExt=(path:string|null|undefined,includeDot:boolean=false,toLower:boolean=true):string=>
{
    if(!path){
        return '';
    }

    const q=path.indexOf('?');
    if(q!==-1){
        path=path.substring(0,q);
    }

    const s=path.lastIndexOf('/');
    const d=path.lastIndexOf('.');
    if(s>d || d===-1){
        return '';
    }

    const ext=path.substring(d+(includeDot?0:1));

    return toLower?ext.toLowerCase():ext;
}

export const getFileName=(path?:string|null): string=>
{
    if(!path){
        return '';
    }
    if(path.endsWith('/')){
        path=path.substring(0,path.length-1);
    }

    const i=path.lastIndexOf('/');
    return i===-1?path:path.substring(i+1);
}

export const getDirectoryName=(path?:string|null): string=>
{
    if(!path){
        return '';
    }
    if(path.endsWith('/')){
        path=path.substring(0,path.length-1);
    }

    const i=path.lastIndexOf('/');
    return i===-1?'/':path.substring(0,i);
}

export const getFileNameNoExt=(path?:string|null): string=>
{

    path=getFileName(path);
    if(!path){
        return path;
    }

    const i=path.lastIndexOf('.');
    return i===-1?path:path.substring(0,i);
}

export const decodePathParts=<TPath extends string|null|undefined>(path:TPath):TPath=>
{
    if(!path){
        return path;
    }

    let p:string=path;

    const [filePath,query]=p.split('?',2);
    p=filePath.split('/').map(p=>decodeURIComponent(p)).join('/');
    if(query){
        p+='?'+query;
    }
    return p as TPath;
}


export const httpReg=/^https?:\/\//i
export const isHttp=(path:string|null|undefined):boolean=>
{
    if(!path){
        return false;
    }
    return httpReg.test(path);
}

export const protocolReg=/^(\w+):\/\//
export const isRooted=(path:string|null|undefined):boolean=>
{
    if(!path){
        return false;
    }
    return path[0]==='/' || protocolReg.test(path);
}
