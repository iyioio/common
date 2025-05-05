import { NotFoundError, Scope, getContentType, getFileName } from "@iyio/common";
import { supClient } from "@iyio/supabase-common";
import { VfsCtrl, VfsDirReadOptions, VfsDirReadResult, VfsItem, VfsItemGetOptions, VfsMntCtrl, VfsMntCtrlOptions, VfsMntPt, createNotFoundVfsDirReadResult, defaultVfsIgnoreFiles, vfsMntTypes } from "@iyio/vfs";
import { vfsSupabaseBucketParam } from "./vfs-supabase.deps";

export interface VfsSupabaseMntCtrlOptions extends VfsMntCtrlOptions
{
    ignoreFilenames?:string[];
    bucketName:string;
}

export class VfsSupabaseMntCtrl extends VfsMntCtrl
{

    public static fromScope(scope:Scope){
        return new VfsSupabaseMntCtrl({
            bucketName:scope.require(vfsSupabaseBucketParam)
        })
    }

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

        const r=await this._getItemAsync(fs, mnt, path, sourceUrl);
        if(r){
            return r;
        }
        return await this._writeStringAsync(fs, mnt, path, sourceUrl, '');
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

        const path = sourceUrl.endsWith('/') ? sourceUrl : sourceUrl + '/';

        const r = await supClient().storage.from(this.bucketName).list(path, {
            limit: options.limit,
            offset: options.offset,
            sortBy: { column: 'name', order: 'asc' }
        });

        if(r.error){
            throw new Error(r.error.message);
        }

        if(!r.data){
            return createNotFoundVfsDirReadResult(options);
        }

        const items: VfsItem[] = [];

        for(const obj of r.data) {
            // Skip files that should be ignored
            if(this.ignoreFilenames.includes(obj.name)) {
                continue;
            }

            const isFolder = obj.metadata && obj.metadata["mimetype"] === 'application/x-directory';
            items.push({
                id: obj.id,
                type: isFolder ? 'dir' : 'file',
                name: getFileName(obj.name),
                path: obj.name,
                size: obj.metadata?.["size"] || 0,
                contentType: obj.metadata?.["mimetype"] || getContentType(obj.name),
            });
        }

        return {
            items,
            count: items.length,
            offset: options.offset || 0,
            total:items.length,// todo - get count from DB
            notFound:false,

        };
    }

    protected override _mkDirAsync=async (fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined):Promise<VfsItem>=>
    {
        if(!sourceUrl){
            throw new Error('sourceUrl required');
        }

        const dirPath = sourceUrl.endsWith('/') ? sourceUrl : sourceUrl + '/';
        const dirMarker = new Blob([], { type: 'application/x-directory' });

        const r = await supClient().storage.from(this.bucketName).upload(dirPath + '.dir', dirMarker);

        if(r.error){
            throw new Error(r.error.message);
        }

        return {
            id: r.data?.id || dirPath,
            type: 'dir',
            name: getFileName(dirPath),
            path: dirPath,
            size: 0,
            contentType: 'application/x-directory',
        };
    }

    protected override _removeAsync=async (fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined):Promise<VfsItem>=>
    {
        if(!sourceUrl){
            throw new Error('sourceUrl required');
        }

        // Get item info before removing it
        const item = await this._getItemAsync(fs, mnt, path, sourceUrl);

        if(!item) {
            throw new NotFoundError();
        }

        const r = await supClient().storage.from(this.bucketName).remove([sourceUrl]);

        if(r.error){
            throw new Error(r.error.message);
        }

        return item;
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
        const blob = await this.readBlobAsync(sourceUrl);
        return await blob.text();
    }

    protected override _writeStringAsync=async (fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined,content:string):Promise<VfsItem>=>
    {
        if(!sourceUrl){
            throw new Error('sourceUrl required');
        }

        const blob = new Blob([content], { type: getContentType(sourceUrl) });

        const r = await supClient().storage.from(this.bucketName).upload(sourceUrl, blob, {
            upsert: true
        });

        if(r.error){
            throw new Error(r.error.message);
        }

        return await this._getItemAsync(fs, mnt, path, sourceUrl) || {
            id: r.data?.id || sourceUrl,
            type: 'file',
            name: getFileName(sourceUrl),
            path: sourceUrl,
            size: content.length,
            contentType: getContentType(sourceUrl)
        };
    }

    protected override _appendStringAsync=async (fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined,content:string):Promise<VfsItem>=>
    {
        if(!sourceUrl){
            throw new Error('sourceUrl required');
        }

        let existingContent = '';
        try {
            existingContent = await this._readStringAsync(fs, mnt, path, sourceUrl);
        } catch (error) {
            throw new Error ("Error")
        }

        const combinedContent = existingContent + content;

        return await this._writeStringAsync(fs, mnt, path, sourceUrl, combinedContent);
    }

    protected override _readBufferAsync=async (fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined):Promise<Uint8Array>=>
    {
        const blob = await this.readBlobAsync(sourceUrl);
        return new Uint8Array(await blob.arrayBuffer());
    }

    protected override _writeBufferAsync=async (fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined,buffer:Uint8Array|Blob):Promise<VfsItem>=>
    {
        if(!sourceUrl){
            throw new Error('sourceUrl required');
        }

        const blob = buffer instanceof Blob ? buffer : new Blob([buffer], { type: getContentType(sourceUrl) });

        const r = await supClient().storage.from(this.bucketName).upload(sourceUrl, blob, {
            upsert: true
        });

        if(r.error){
            throw new Error(r.error.message);
        }

        return await this._getItemAsync(fs, mnt, path, sourceUrl) || {
            id: r.data?.id || sourceUrl,
            type: 'file',
            name: getFileName(sourceUrl),
            path: sourceUrl,
            size: blob.size,
            contentType: getContentType(sourceUrl)
        };
    }

    // todo - correctly implement
    // protected override _writeStreamAsync=async (fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined,stream:VfsReadStream):Promise<VfsItem>=>
    // {
    //     if(!sourceUrl){
    //         throw new Error('sourceUrl required');
    //     }

    //     const chunks: Uint8Array[] = [];
    //     for await (const chunk of stream) {
    //         chunks.push(chunk instanceof Uint8Array ? chunk : new Uint8Array(await chunk.arrayBuffer()));
    //     }

    //     const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    //     const buffer = new Uint8Array(totalLength);
    //     let offset = 0;
    //     for (const chunk of chunks) {
    //         buffer.set(chunk, offset);
    //         offset += chunk.length;
    //     }

    //     return await this._writeBufferAsync(fs, mnt, path, sourceUrl, buffer);
    // }

    // todo - correctly implement
    // protected override _getReadStream=(fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined):Promise<VfsReadStreamWrapper>=>
    // {
    //     if(!sourceUrl){
    //         throw new Error('sourceUrl required');
    //     }

    //     // Create an async generator function that reads the file
    //     const readGenerator = async function*(self: VfsSupabaseMntCtrl) {
    //         const blob = await self.readBlobAsync(sourceUrl);
    //         yield blob;
    //     };

    //     // Return a wrapper for the generator
    //     return Promise.resolve({
    //         stream: readGenerator(this),
    //         close: async () => {
    //             // Nothing to close for this simple implementation
    //         }
    //     });
    // }
}
