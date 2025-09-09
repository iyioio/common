import { NotFoundError, getContentType, getFileName, joinPaths } from "@iyio/common";
import { supClient } from "@iyio/supabase-common";
import { VfsCtrl, VfsDirReadOptions, VfsDirReadResult, VfsItem, VfsItemGetOptions, VfsMntCtrl, VfsMntCtrlOptions, VfsMntPt, VfsReadStream, createNotFoundVfsDirReadResult, defaultVfsIgnoreFiles, testVfsFilter, vfsMntTypes } from "@iyio/vfs";
import { Buffer } from "node:buffer";

export interface VfsSupabaseMntCtrlOptions extends VfsMntCtrlOptions
{
    ignoreFilenames?:string[];
}

export class VfsSupabaseMntCtrl extends VfsMntCtrl
{

    private readonly ignoreFilenames:string[];

    public constructor({
        ignoreFilenames=defaultVfsIgnoreFiles,
        ...options
    }:VfsSupabaseMntCtrlOptions={}){
        super({
            ...options,
            type:vfsMntTypes.bucket,
            removeProtocolFromSourceUrls:true,
        })
        this.ignoreFilenames=ignoreFilenames;
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

    private parseSrcUrl(sourceUrl:string,dir=false):{bucket:string,path:string}{
        const bucketReg=/^\/?bucket:\/\/(\w[\w-.]{2,62})\/(.*)$/;
        const match=bucketReg.exec(sourceUrl);
        let path=match?.[2]??sourceUrl;
        if(dir && !path.endsWith('/')){
            path+='/'
        }
        return {bucket:match?.[1]??'default-bucket',path}
    }


    protected override _getItemAsync=async (_fs:VfsCtrl,_mnt:VfsMntPt,_path:string,sourceUrl:string|undefined,_options?:VfsItemGetOptions):Promise<VfsItem|undefined>=>
    {
        if(!sourceUrl){
            return undefined;
        }

        const {bucket,path}=this.parseSrcUrl(sourceUrl);
        const r=await supClient().storage.from(bucket).info(path);

        if(r.error){
            return undefined;
        }

        if(!r.data){
            return undefined;
        }

        const info=r.data;

        return {
            id:sourceUrl,
            type:'file',
            name:getFileName(info.name),
            path:info.name,
            size:info.size,
            contentType:info.contentType??getContentType(info.name),
        }

    }

    protected override _readDirAsync=async (_fs:VfsCtrl,_mnt:VfsMntPt,options:VfsDirReadOptions,sourceUrl:string|undefined):Promise<VfsDirReadResult>=>
    {
        if(!sourceUrl){
            return createNotFoundVfsDirReadResult(options);
        }

        const {bucket,path}=this.parseSrcUrl(sourceUrl,true);

        const r = await supClient().storage.from(bucket).list(path, {
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
            if(this.ignoreFilenames.includes(obj.name) || (options.filter && !testVfsFilter(obj.name,options.filter))) {
                continue;
            }

            const contentType=obj?.metadata?.['mimetype']??getContentType(obj.name);

            const isFolder = contentType === 'application/x-directory';
            items.push({
                id: joinPaths(sourceUrl,obj.name),
                type: isFolder ? 'dir' : 'file',
                name: getFileName(obj.name),
                path: joinPaths(path,obj.name),
                size: obj.metadata?.["size"] || undefined,
                contentType,
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

    protected override _mkDirAsync=async (_fs:VfsCtrl,_mnt:VfsMntPt,_path:string,sourceUrl:string|undefined):Promise<VfsItem>=>
    {
        if(!sourceUrl){
            throw new Error('sourceUrl required');
        }

        const dirMarker = new Blob([], { type: 'application/x-directory' });

        const {bucket,path}=this.parseSrcUrl(sourceUrl,true)

        const r = await supClient().storage.from(bucket).upload(path + '.dir', dirMarker,{contentType:'application/x-directory'});

        if(r.error){
            throw new Error(r.error.message);
        }

        return {
            id: sourceUrl,
            type: 'dir',
            name: getFileName(path),
            path: path,
            size: 0,
            contentType: 'application/x-directory',
        };
    }

    protected override _removeAsync=async (fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined):Promise<VfsItem>=>
    {
        if(!sourceUrl){
            throw new Error('sourceUrl required');
        }

        const {bucket,path:_path}=this.parseSrcUrl(sourceUrl);

        // Get item info before removing it
        const item = await this._getItemAsync(fs, mnt, path, sourceUrl);

        if(!item) {
            throw new NotFoundError();
        }

        const r = await supClient().storage.from(bucket).remove([_path]);

        if(r.error){
            throw new Error(r.error.message);
        }

        return item;
    }

    private async readBlobAsync(sourceUrl:string|undefined):Promise<Blob>{
        if(!sourceUrl){
            throw new Error('sourceUrl required');
        }
        const {bucket,path}=this.parseSrcUrl(sourceUrl);

        const r=await supClient().storage.from(bucket).download(path);

        if(r.error){
            throw new NotFoundError();
        }

        if(!r.data){
            throw new NotFoundError();
        }

        return r.data;
    }

    protected override _readStringAsync=async (_fs:VfsCtrl,_mnt:VfsMntPt,_path:string,sourceUrl:string|undefined):Promise<string>=>
    {
        const blob = await this.readBlobAsync(sourceUrl);
        return await blob.text();
    }

    protected override _writeStringAsync=async (fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined,content:string):Promise<VfsItem>=>
    {
        if(!sourceUrl){
            throw new Error('sourceUrl required');
        }


        const {bucket,path:_path}=this.parseSrcUrl(sourceUrl)
        ;
        const blob = new Blob([content], { type: getContentType(path) });

        const r = await supClient().storage.from(bucket).upload(path, blob, {
            upsert: true,
            contentType:getContentType(path)
        });

        if(r.error){
            throw new Error(r.error.message);
        }

        return await this._getItemAsync(fs, mnt, path, sourceUrl) || {
            id: sourceUrl,
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
        } catch {
            throw new Error ("Error")
        }

        const combinedContent = existingContent + content;

        return await this._writeStringAsync(fs, mnt, path, sourceUrl, combinedContent);
    }

    protected override _readBufferAsync=async (_fs:VfsCtrl,_mnt:VfsMntPt,_path:string,sourceUrl:string|undefined):Promise<Uint8Array>=>
    {
        const blob = await this.readBlobAsync(sourceUrl);
        return new Uint8Array(await blob.arrayBuffer());
    }

    protected override _writeBufferAsync=async (fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined,buffer:Uint8Array|Blob):Promise<VfsItem>=>
    {
        if(!sourceUrl){
            throw new Error('sourceUrl required');
        }
        const {bucket,path:_path}=this.parseSrcUrl(sourceUrl);

        const blob = buffer instanceof Blob ? buffer : new Blob([buffer as any], { type: getContentType(sourceUrl) });

        const r = await supClient().storage.from(bucket).upload(path, blob, {
            upsert: true,
            contentType:getContentType(path)
        });

        if(r.error){
            throw new Error(r.error.message);
        }

        return await this._getItemAsync(fs, mnt, path, sourceUrl) || {
            id: sourceUrl,
            type: 'file',
            name: getFileName(sourceUrl),
            path: sourceUrl,
            size: blob.size,
            contentType: getContentType(sourceUrl)
        };
    }

    //todo - correctly implement
    protected override _writeStreamAsync=async (fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined,stream:VfsReadStream):Promise<VfsItem>=>
    {
        if(!sourceUrl){
            throw new Error('sourceUrl required');
        }

        const chunks:Buffer[]=[];
        await new Promise<void>((resolve, reject) => {

            if(!stream.on){
                reject(new Error('stream must support event callbacks'))
                return;
            }
            stream.on('data',(chunk:any)=>chunks.push(Buffer.from(chunk)));
            stream.on('error',(err:any)=>reject(err));
            stream.on('end',()=>resolve());
        });

        return await this._writeBufferAsync(fs, mnt, path, sourceUrl, new Blob(chunks as any,{type:getContentType(path)}));
    }

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
