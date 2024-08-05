// Convo FS is a virtual filesystem

import { joinPaths, starStringTest } from "@iyio/common";
import { VfsDirReadOptions, VfsDirReadResult, VfsFilter, VfsMntPt } from "./vfs-types";


export const vfsMntTypes={
    file:'file',
    httpProxy:'httpProxy',
} as const;

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

export const testVfsFilter=(filename:string,filter:VfsFilter|null|undefined):boolean=>{
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
            if(!starStringTest(filter.match,filename)){
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

export const defaultVfsIgnoreFiles=[
    '.DS_Store'
]
