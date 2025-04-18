import { NotFoundError, getContentType, getFileName } from "@iyio/common";
import { VfsCtrl, VfsDirReadOptions, VfsDirReadResult, VfsItem, VfsItemGetOptions, VfsMntCtrl, VfsMntCtrlOptions, VfsMntPt, VfsReadStream, VfsReadStreamWrapper, createNotFoundVfsDirReadResult, defaultVfsIgnoreFiles, vfsMntTypes } from "@iyio/vfs";
import { supClient } from "./_tmp";

export interface VfsSupabaseMntCtrlOptions extends VfsMntCtrlOptions
{
    ignoreFilenames?:string[];
    bucketName:string;
}

/**
 * Mounts files stored on a hard drive
 */
export class VfsSupabaseMntCtrl extends VfsMntCtrl
{

    private readonly ignoreFilenames:string[];

    private readonly bucketName:string;

    public constructor({
        ignoreFilenames=defaultVfsIgnoreFiles,
        bucketName,
        ...options
    }:VfsSupabaseMntCtrlOptions){
        super({
            ...options,
            type:vfsMntTypes.file,
            removeProtocolFromSourceUrls:true,
        })
        this.ignoreFilenames=ignoreFilenames;
        this.bucketName=bucketName;
    }


    protected override _touchAsync=async (fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined):Promise<VfsItem>=>{
        if(!sourceUrl){
            throw new Error('sourceUrl required');
        }

    }


    protected override _getItemAsync=async (fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined,options?:VfsItemGetOptions):Promise<VfsItem|undefined>=>
    {
        if(!sourceUrl){
            return undefined;
        }

        const r=await supClient().storage.from(this.bucketName).info(sourceUrl);

        if(r.error){
            throw new Error(r.error.message);
        }

        if(!r.data){
            throw new NotFoundError();
        }

        const info=r.data;

        return {
            id:info.id,
            type:'file',
            name:getFileName(info.name),
            path:info.name,
            size:info.size,
            contentType:info.contentType??getContentType(info.name),
        }

    }

    protected override _readDirAsync=async (fs:VfsCtrl,mnt:VfsMntPt,options:VfsDirReadOptions,sourceUrl:string|undefined):Promise<VfsDirReadResult>=>
    {
        if(!sourceUrl){
            return createNotFoundVfsDirReadResult(options);
        }



    }

    protected override _mkDirAsync=async (fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined):Promise<VfsItem>=>
    {
        if(!sourceUrl){
            throw new Error('sourceUrl required');
        }

    }

    protected override _removeAsync=async (fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined):Promise<VfsItem>=>
    {
        if(!sourceUrl){
            throw new Error('sourceUrl required');
        }
    }

    private async readBlobAsync(sourceUrl:string|undefined):Promise<Blob>{
        if(!sourceUrl){
            throw new Error('sourceUrl required');
        }

        const r=await supClient().storage.from(this.bucketName).download(sourceUrl);

        if(r.error){
            throw new Error(r.error.message);
        }

        if(!r.data){
            throw new NotFoundError();
        }

        return r.data;
    }

    protected override _readStringAsync=async (fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined):Promise<string>=>
    {

        return (await this.readBlobAsync(sourceUrl)).toString();
    }

    protected override _writeStringAsync=async (fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined,content:string):Promise<VfsItem>=>
    {
        if(!sourceUrl){
            throw new Error('sourceUrl required');
        }

    }

    protected override _appendStringAsync=async (fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined,content:string):Promise<VfsItem>=>
    {
        if(!sourceUrl){
            throw new Error('sourceUrl required');
        }
    }

    protected override _readBufferAsync=(fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined):Promise<Uint8Array>=>
    {
        return this._readAsync(sourceUrl);
    }

    protected override _writeBufferAsync=async (fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined,buffer:Uint8Array|Blob):Promise<VfsItem>=>
    {
        if(!sourceUrl){
            throw new Error('sourceUrl required');
        }
    }

    protected override _writeStreamAsync=async (fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined,stream:VfsReadStream):Promise<VfsItem>=>
    {
        if(!sourceUrl){
            throw new Error('sourceUrl required');
        }
    }

    protected override _getReadStream=(fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined):Promise<VfsReadStreamWrapper>=>
    {
        if(!sourceUrl){
            throw new Error('sourceUrl required');
        }
    }
}
