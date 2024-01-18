import { pathExistsSync } from '@iyio/node-common';
import { readdirSync, statSync } from 'fs';
import * as Path from 'path';

export interface RedirectRegex
{
    match:RegExp;
    path:string;

}

const defaultExtensions=['.html','.htm'];
const ignore=['node_modules'];


export const stringifyRedirectMap=(map:RedirectRegex[])=>(
    '['+map.map(m=>(`{match:${m.match.toString()},path:${JSON.stringify(m.path)}}`)).join(',\n')+']'
)

export const getRegexRedirectMapAsString=(dir:string,exts:string[]=defaultExtensions,ignorePaths?:string[]):string=>{
    return stringifyRedirectMap(getRegexRedirectMap(dir,exts,ignorePaths))
}

export function getRegexRedirectMap(dir:string,exts:string[]=defaultExtensions,ignorePaths?:string[]):RedirectRegex[]
{
    const map:RedirectRegex[]=[{match:/^\/$/i,path:'/index.html'}];
    scanRegex(dir,map,exts,'',ignorePaths);
    map.push({match:/^\/index$/i,path:'/index.html'});
    return map;
}

const dynamicReg=/\[[^\]]+\]/g;

const scanRegex=(dir:string, map:RedirectRegex[], exts:string[], basePath:string,ignorePaths?:string[])=>
{
    if(pathExistsSync(Path.join(dir,'.redirect-map-ignore'))){
        return;
    }

    const items=readdirSync(dir);

    for(const item of items){
        const name=item.toLowerCase();
        if(ignore.includes(name)){
            continue;
        }
        const path=Path.join(dir,item);
        const stat=statSync(path);
        if(stat.isDirectory()){
            scanRegex(path,map,exts,basePath+'/'+item,ignorePaths);
        }
        const ext=exts.find(e=>name.endsWith(e));
        if(ext){
            let mPath:string;
            let mBase:string;
            const noExt=name.substring(0,name.length-ext.length);
            if(noExt==='index'){
                mPath=basePath+'/'+item;
                mBase=basePath;
            }else{
                mPath=basePath+'/'+item;
                mBase=basePath+'/'+noExt;
            }
            let lp=mPath.toLowerCase();
            if(!lp.startsWith('/')){
                lp='/'+lp;
            }
            if(mPath==='/index.html' || ignorePaths?.some(p=>lp.startsWith(p.toLocaleLowerCase()))){
                continue;
            }
            map.push({
                match:new RegExp('^'+mBase.replace(dynamicReg,'[^/]+')+'$','i'),
                path:mPath
            })
        }
    }
}
