import type { VfsMntCtrl } from "./VfsMntCtrl";

export interface VfsConfig
{
    mountPoints:VfsMntPt[];
}

export interface VfsMntPt
{
    id?:string;

    mountPath:string;

    type:string;

    /**
     * The source url of the mount relative to it's storage device. Can be an absolute or relative
     * path, include or exclude a protocol and have query parameters. If a mount point does not
     * define a sourceUrl its controller will be responsible for translating virtual paths
     */
    sourceUrl?:string;
}

export type VfsItemType='file'|'dir';

export interface VfsItem
{
    id?:string;

    type:VfsItemType;

    /**
     * Full path in the virtual filesystem
     */
    path:string;

    /**
     * File name without base directory
     */
    name:string;

    /**
     * Size in bytes. By default size in not returns when getting a VfsItem.
     */
    size?:number;

}

/**
 * Extra options for getting VfsItems
 */
export interface VfsItemGetOptions
{
    /**
     * Causes VfsItem.size to be populated.
     */
    includeSize?:boolean;
}

export interface VfsMntPtProviderConfig
{
    getCtrl?:(mnt:VfsMntPt)=>Promise<VfsMntCtrl|undefined>|VfsMntCtrl|undefined;

    /**
     * If true the default convoMountPointFactory will be used which searches for controls in the
     * root scope.
     */
    searchRootScope?:boolean;
}

export interface VfsFilter
{
    startsWith?:string;
    endsWith?:string;
    match?:RegExp|string;
}

export interface VfsDirReadOptions
{
    path:string;
    offset?:number;
    limit?:number;
    filter?:VfsFilter;
}

export interface VfsDirReadResult
{
    items:VfsItem[];
    offset:number;
    count:number;
    total:number;
    notFound:boolean;
}

export interface VfsReadStream
{
    pipe(destinationStream:any,options?:any):any;
    destroy(error?:Error):any;
}

export interface VfsReadStreamWrapper
{
    stream:VfsReadStream;
    size?:number;
    contentType?:string;
}
