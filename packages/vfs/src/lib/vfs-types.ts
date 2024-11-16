import { DisposeCallback, Evt, EvtTrigger } from "@iyio/common";
import type { VfsMntCtrl } from "./VfsMntCtrl";

export interface VfsConfig
{
    mountPoints:VfsMntPt[];

    triggers?:EvtTrigger[];

    /**
     * If true file system configuration via local config files will be enabled. Each individual
     * mount point must also enable this option for local file based configuration to be enabled.
     */
    allowLocalConfig?:boolean;

    /**
     * Name of the config files in local mount directories. Mount points can override this value.
     * @default ".vsf-config"
     */
    localConfigFileName?:string;

    /**
     * If true config files will be read recursively. Each individual mount point must also enable
     * this option for recursive configuration to be enabled.
     */
    allowRecursiveLocalConfig?:boolean;
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

    /**
     * If true file system configuration via local config files will be enabled. The mount point's
     * parent file system controller must also enable this option for local file based
     * configuration to be enabled.
     */
    allowLocalConfig?:boolean;

    /**
     * Name of the config files in local mount directories. Defaults to the value defined by the
     * mount points parent file system controller. Defaults the the point point's parent file
     * system controller's value.
     */
    localConfigFileName?:string;

    /**
     * If true config files will be read recursively. The mount point's parent file system controller
     * must also enable this option for recursive configuration to be enabled.
     */
    allowRecursiveLocalConfig?:boolean;
}

export interface VfsLocalFsConfig
{
    triggers?:EvtTrigger[];
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

    contentType?:string;

    /**
     * A http url where the file can be reached
     */
    url?:string;

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

export interface VfsWatchOptions
{
    recursive?:boolean;
    ignore?:VfsFilter[];
}

export interface VfsWatchHandle
{
    dispose?:DisposeCallback;
}

export interface VfsMntPtProviderConfig
{
    getCtrl?:(mnt:VfsMntPt)=>Promise<VfsMntCtrl|undefined>|VfsMntCtrl|undefined;

    ctrls?:VfsMntCtrl[];

    /**
     * If true the default convoMountPointFactory will be used which searches for controls in the
     * root scope.
     */
    searchRootScope?:boolean;
}

export interface VfsFilter
{
    equals?:string;
    contains?:string;
    startsWith?:string;
    endsWith?:string;
    /**
     * A regular expression or a star string
     */
    match?:RegExp|string;

    /**
     * If true and match is a string the match string is treated as a full regex
     */
    stringMatchIsReg?:boolean;
    /**
     * Inverts or negates the filter.
     */
    not?:boolean;
}

export interface VfsDirReadOptions
{
    path:string;
    offset?:number;
    limit?:number;
    filter?:VfsFilter;
}

export interface VfsDirReadRecursiveOptions
{
    path:string;
    excludeDirectories?:boolean;
    maxDepth?:number;
    limit?:number;
    offset?:number;
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

export type VfsItemChangeType='add'|'change'|'remove';

export interface VfsItemChange
{
    changeType:VfsItemChangeType;
    item:VfsItem;
}
export const vfsItemChangeEvtType='vfsItemChange';

export type VfsItemChangeEvt=Evt<typeof vfsItemChangeEvtType,VfsItemChange>;

export const isVfsItemChangeEvt=(value:Evt):value is VfsItemChangeEvt=>value.type===vfsItemChangeEvtType;

export interface VfsTrigger extends VfsItemChange
{
    trigger:EvtTrigger;
}
export const vfsTriggerEvtType='vfsTrigger';
export type VfsTriggerEvt=Evt<typeof vfsTriggerEvtType,VfsTrigger>;
export const isVfsTriggerEvt=(value:Evt):value is VfsTriggerEvt=>value.type===vfsTriggerEvtType;
