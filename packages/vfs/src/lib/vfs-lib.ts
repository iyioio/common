// Convo FS is a virtual filesystem

import { EvtTrigger, ValueCondition, currentBaseUser, getFileName, joinPaths, starStringTestCached } from "@iyio/common";
import { VfsDirReadOptions, VfsDirReadResult, VfsFilter, VfsItem, VfsLocalFsConfig, VfsMntPt } from "./vfs-types";


export const vfsMntTypes={
    file:'file',
    httpProxy:'httpProxy',
    indexDb:'indexDb',
} as const;

export const defaultVfsIgnoreFiles=[
    '.DS_Store'
]

export const vfsTopic='vfs';

export const vfsTriggerTopic='vfs-trigger';

export const vfsDefaultConfigFileName='.vfs-config';

/**
 * Sorts an array of mounts using the length of the mount point in descending order. This
 * makes mount points with deeper paths appear earlier.
 */
export const sortVfsMntPt=(mountPoints:VfsMntPt[])=>{
    mountPoints.sort((a,b)=>b.mountPath.length-a.mountPath.length);
}

/**
 * Attempts to get the source url of the virtual path.
 *
 * @example
 *
 * ## Filesystem mount
 * /home/username/docs/vsf -> /virtual-files
 * virtual mnt:          /virtual-files
 * virtual path:         /virtual-files/docs/report.txt
 * disk mnt:             /home/username/docs/vsf
 * disk path:            /home/username/docs/vsf/docs/report.txt
 *
 * ## HTTP mount
 * https://example.com/user-files -> /inter-web-files
 * virtual mnt:          /inter-web-files
 * virtual path:         /inter-web-files/docs/report.txt
 * disk mnt:             https://example.com/user-files
 * disk path:            https://example.com/user-files/docs/report.txt
 */
export const getVfsSourceUrl=(mnt:VfsMntPt,virtualPath:string,throwOnInvalidPaths=true):string|undefined=>{

    virtualPath=normalizeVfsPath(virtualPath);

    if(mnt.sourceUrl===undefined){
        return undefined;
    }

    if(!virtualPath.startsWith('/')){
        if(throwOnInvalidPaths){
            throw new Error(`virtual path must be absolute. virtualPath:${virtualPath}`);
        }else{
            return undefined;
        }
    }

    if(!mnt.mountPath.startsWith('/')){
        if(throwOnInvalidPaths){
            throw new Error(`mount path must be absolute. mount path:${virtualPath}`);
        }else{
            return undefined;
        }
    }

    if(!virtualPath.startsWith(mnt.mountPath)){
        if(throwOnInvalidPaths){
            throw new Error(
                'The given path virtualPath is not in the given mount path. '+
                `virtualPath:${virtualPath}, mount path:${mnt.mountPath} `
            );
        }
        return undefined;
    }

    virtualPath=virtualPath.substring(mnt.mountPath.length);
    if(virtualPath.startsWith('/')){
        virtualPath=virtualPath.substring(1);
    }

    const qi=mnt.sourceUrl.indexOf('?');
    if(qi===-1){
        return joinPaths(mnt.sourceUrl,virtualPath);
    }else{
        return joinPaths(mnt.sourceUrl.substring(0,qi),virtualPath)+mnt.sourceUrl.substring(qi);
    }
}


export const createNotFoundVfsDirReadResult=(options:VfsDirReadOptions):VfsDirReadResult=>{
    return {
        items:[],
        offset:options.offset??0,
        count:0,
        total:0,
        notFound:true,
    }
}

export const testVfsFilter=(filename:string,filter:(VfsFilter|null|undefined)[]|VfsFilter|null|undefined):boolean=>{
    filename=getFileName(filename);
    if(Array.isArray(filter)){
        for(const f of filter){
            if(!_testVfsFilter(filename,f)){
                return false;
            }
        }
        return true;
    }else{
        return _testVfsFilter(filename,filter);
    }
}

const _testVfsFilter=(filename:string,filter:VfsFilter|null|undefined):boolean=>{
    if(!filter){
        return true;
    }
    if(filter.startsWith!==undefined && !filename.startsWith(filter.startsWith)){
        return false;
    }
    if(filter.endsWith!==undefined && !filename.endsWith(filter.endsWith)){
        return false;
    }
    if(filter.match){
        if(typeof filter.match === 'string'){
            if(!starStringTestCached(filter,filter.match,filename,'i')){
                return false;
            }
        }else{
            if(!filter.match.test(filename)){
                return false;
            }
        }
    }
    return true;
}

export const normalizeVfsPath=(path:string):string=>{

    if(path.startsWith('~')){
        const user=currentBaseUser.get();
        path=`/users/${user?.id||'null'}${path.substring(1)}`
    }

    if(path.endsWith('/')){
        path=path.substring(0,path.length-1);
    }

    if(!path.startsWith('/')){
        path='/'+path;
    }
    path=path.replace(bsReg,'/');
    if(!path){
        path='/';
    }
    return path;
}
const bsReg=/\\/g;

export const vfsSourcePathToVirtualPath=(sourcePath:string,mnt:VfsMntPt):string|undefined=>{
    if(!mnt.sourceUrl){
        return undefined;
    }
    sourcePath=normalizeVfsPath(sourcePath);
    const mntPath=normalizeVfsPath(mnt.sourceUrl);

    if(!sourcePath.startsWith(mntPath)){
        return undefined;
    }
    sourcePath=sourcePath.substring(mntPath.length);
    if(sourcePath.startsWith('/')){
        sourcePath=sourcePath.substring(1);
    }
    return joinPaths(mnt.mountPath,sourcePath);
}

export const mergeVfsLocalFsConfig=(target:VfsLocalFsConfig,add:VfsLocalFsConfig):void=>{
    if(add.triggers){
        if(!target.triggers){
            target.triggers=[];
        }
        target.triggers.push(...add.triggers);
    }
}

export const autoFormatVfsTriggers=(triggers:EvtTrigger[])=>{
    for(const t of triggers){
        autoFormatVfsTrigger(t);
    }
}
export const autoFormatVfsTrigger=(trigger:EvtTrigger)=>{
    if(!trigger.matchKey.includes('*')){
        return;
    }

    const parts=trigger.matchKey.split('*');
    trigger.matchStart=true;
    const cond:ValueCondition=parts.length===2?{
        path:'evt.value.item.path',
        op:'ends-with',
        value:parts[1] as string,
    }:{
        path:'evt.value.item.path',
        op:'star-match',
        value:trigger.matchKey,
    }
    if(trigger.condition){
        trigger.condition={
            op:'and',
            conditions:[
                cond,
                trigger.condition
            ]
        }
    }else{
        trigger.condition=cond;
    }
    trigger.matchKey=parts[0] as string;

}

export const isVfsFilePath=(path:string)=>{
    return path.startsWith('/') || path.startsWith('~/') || path.startsWith('./');
}

export const getVfsItemUrl=(urlOrItem:VfsItem|string|null|undefined,itemPathPrefix?:string,prefixUrl?:boolean):string|undefined=>{
    if(!urlOrItem){
        return undefined;
    }
    if(typeof urlOrItem === 'string'){
        return (prefixUrl && itemPathPrefix)?joinPaths(itemPathPrefix,urlOrItem):urlOrItem;
    }

    if(urlOrItem.url){
        return urlOrItem.url;
    }

    const path=normalizeVfsPath(urlOrItem.path);
    return itemPathPrefix?joinPaths(itemPathPrefix,path):path;

}

export const isVfsItem=(value:string|VfsItem|null|undefined):value is VfsItem=>{
    return (value && (typeof value ==='object'))?true:false;
}
