import { HttpClient, httpClient } from "@iyio/common";
import { VfsCtrl } from "./VfsCtrl";
import { VfsMntCtrl, VfsMntCtrlOptions } from "./VfsMntCtrl";
import { vfsMntTypes } from "./vfs-lib";
import { VfsDirReadOptions, VfsDirReadResult, VfsItem, VfsItemGetOptions, VfsMntPt, VfsReadStreamWrapper } from "./vfs-types";

export interface VfsHttpProxyMntCtrlOptions extends VfsMntCtrlOptions
{
    baseUrl:string;
    httpClient?:HttpClient;
}

export class VfsHttpProxyMntCtrl extends VfsMntCtrl
{

    private readonly _httpClient?:HttpClient;

    private readonly baseUrl:string;

    public constructor({
        baseUrl,
        httpClient,
        ...options
    }:VfsHttpProxyMntCtrlOptions){
        super({
            ...options,
            type:vfsMntTypes.file,
            removeProtocolFromSourceUrls:true,
        })
        this._httpClient=httpClient;
        this.baseUrl=baseUrl;
        if(this.baseUrl.endsWith('/')){
            this.baseUrl=this.baseUrl.substring(0,this.baseUrl.length-1);
        }
    }

    private getHttpClient(){
        return this._httpClient??httpClient();
    }

    private getUrl(sourceUrl:string|undefined,action:string){
        if(sourceUrl===undefined){
            throw new Error('sourceUrl required');
        }
        if(sourceUrl.startsWith('/')){
            sourceUrl=sourceUrl.substring(1);
        }
        return `${this.baseUrl}/${action}/${sourceUrl}`;
    }

    protected override _getItemAsync=(fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined,options?:VfsItemGetOptions):Promise<VfsItem|undefined>=>
    {
        return this.getHttpClient().getAsync(this.getUrl(sourceUrl,'item'));
    }

    protected override _readDirAsync=async (fs:VfsCtrl,mnt:VfsMntPt,options:VfsDirReadOptions,sourceUrl:string|undefined):Promise<VfsDirReadResult>=>
    {
        const r=await this.getHttpClient().getAsync<VfsDirReadResult>(this.getUrl(sourceUrl,'dir'));
        if(!r){
            throw new Error('vfs api did not return a result');
        }
        return r;
    }

    protected override _mkDirAsync=async (fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined):Promise<VfsItem>=>
    {
        const r=await this.getHttpClient().postAsync<VfsItem>(this.getUrl(sourceUrl,'dir'),{});
        if(!r){
            throw new Error('vfs api did not return a result');
        }
        return r;
    }

    protected override _removeAsync=async (fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined):Promise<VfsItem>=>
    {
        const r=await this.getHttpClient().deleteAsync<VfsItem>(this.getUrl(sourceUrl,'dir'));
        if(!r){
            throw new Error('vfs api did not return a result');
        }
        return r;

    }

    protected override _readStringAsync=async (fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined):Promise<string>=>
    {
        const r=await this.getHttpClient().getAsync<string>(this.getUrl(sourceUrl,'string'));
        if(r===undefined){
            throw new Error('vfs api did not return a result');
        }
        return r;
    }

    protected override _writeStringAsync=async (fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined,content:string):Promise<void>=>
    {
        await this.getHttpClient().postAsync(this.getUrl(sourceUrl,'string'),content);
    }

    protected override _appendStringAsync=async (fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined,content:string):Promise<void>=>
    {
        await this.getHttpClient().putAsync(this.getUrl(sourceUrl,'string'),content);
    }

    protected override _readBufferAsync=async (fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined):Promise<Uint8Array>=>
    {
        const r=await this.getHttpClient().getResponseAsync(this.getUrl(sourceUrl,'stream'));

        if(!r){
            throw new Error('Failed to get stream');
        }

        const blob=await r.blob();

        return new Uint8Array(await blob.arrayBuffer());
    }

    protected override _writeBufferAsync=async (fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined,buffer:Uint8Array):Promise<void>=>
    {
        await this.getHttpClient().postResponseAsync(this.getUrl(sourceUrl,'stream'),new Blob([buffer]));
    }

    // protected override _writeStreamAsync=async (fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined,stream:VfsReadStream):Promise<void>=>
    // {
    //     const blob=new Blob();
    //     const ws=new WritableStream();

    //     await this.getHttpClient().postResponseAsync(this.getUrl(sourceUrl,'stream'),);
    // }

    protected override _getReadStream=async (fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined):Promise<VfsReadStreamWrapper>=>
    {
        const r=await this.getHttpClient().getResponseAsync(this.getUrl(sourceUrl,'stream'));

        if(!r){
            throw new Error('Failed to get stream');
        }

        const stream=r.body??(await r.blob()).stream();

        return {
            stream:{
                pipe:(dest,options)=>{
                    stream.pipeTo(dest,options)
                },
                destroy:()=>{
                    stream.cancel();
                }
            },
        }
    }
}
