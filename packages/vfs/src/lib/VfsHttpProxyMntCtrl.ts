import { HttpClient, getObjKeyCount, httpClient, joinPaths, objectToQueryParamsJson } from "@iyio/common";
import { VfsCtrl } from "./VfsCtrl";
import { VfsMntCtrl, VfsMntCtrlOptions } from "./VfsMntCtrl";
import { vfsMntTypes } from "./vfs-lib";
import { VfsDirReadOptions, VfsDirReadResult, VfsItem, VfsItemGetOptions, VfsMntPt, VfsReadStreamWrapper } from "./vfs-types";

export interface VfsHttpProxyMntCtrlOptions extends VfsMntCtrlOptions
{
    baseUrl:string;
    httpClient?:HttpClient;
    /**
     * Used to assign items a url that don't have one defined
     */
    itemUrlPrefix?:string;
}

export class VfsHttpProxyMntCtrl extends VfsMntCtrl
{

    private readonly _httpClient?:HttpClient;

    private readonly baseUrl:string;

    private readonly itemUrlPrefix?:string;

    public constructor({
        baseUrl,
        httpClient,
        itemUrlPrefix,
        ...options
    }:VfsHttpProxyMntCtrlOptions){
        super({
            ...options,
            type:vfsMntTypes.httpProxy,
            removeProtocolFromSourceUrls:true,
        })
        this._httpClient=httpClient;
        this.baseUrl=baseUrl;
        this.itemUrlPrefix=itemUrlPrefix;
        if(this.baseUrl.endsWith('/')){
            this.baseUrl=this.baseUrl.substring(0,this.baseUrl.length-1);
        }
    }

    private getHttpClient(){
        return this._httpClient??httpClient();
    }

    private getUrl(sourceUrl:string|undefined,action:string,query?:Record<string,any>){
        if(sourceUrl===undefined){
            throw new Error('sourceUrl required');
        }
        if(sourceUrl.startsWith('/')){
            sourceUrl=sourceUrl.substring(1);
        }
        return `${this.baseUrl}/${action}/${sourceUrl}${(query && getObjKeyCount(query))?'?'+objectToQueryParamsJson(query):''}`;
    }

    private setItemUrl(item:VfsItem|null|undefined){
        if(!item || item.url){
            return;
        }
        if(this.itemUrlPrefix){
            item.url=joinPaths(this.itemUrlPrefix,item.path);
        }else if(item.type!=='dir'){
            item.url=this.getUrl(item.path,'stream')
        }
    }

    protected override _touchAsync=async (fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined):Promise<VfsItem>=>{
        const item=await this.getHttpClient().postAsync<VfsItem>(this.getUrl(sourceUrl,'touch'),{});
        if(!item){
            throw new Error('Touched file not returned')
        }
        this.setItemUrl(item);
        return item;
    }

    protected override _getItemAsync=async (fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined,options?:VfsItemGetOptions):Promise<VfsItem|undefined>=>
    {
        const item=await this.getHttpClient().getAsync<VfsItem>(this.getUrl(sourceUrl,'item'));
        this.setItemUrl(item);
        return item;
    }

    protected override _readDirAsync=async (fs:VfsCtrl,mnt:VfsMntPt,options:VfsDirReadOptions,sourceUrl:string|undefined):Promise<VfsDirReadResult>=>
    {
        const oq:any={...options}
        delete oq.path;
        const r=await this.getHttpClient().getAsync<VfsDirReadResult>(this.getUrl(sourceUrl,'dir',oq));
        if(!r){
            throw new Error('vfs api did not return a result');
        }
        for(const item of r.items){
            this.setItemUrl(item);
        }
        return r;
    }

    protected override _mkDirAsync=async (fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined):Promise<VfsItem>=>
    {
        const r=await this.getHttpClient().postAsync<VfsItem>(this.getUrl(sourceUrl,'dir'),{});
        if(!r){
            throw new Error('vfs api did not return a result');
        }
        this.setItemUrl(r);
        return r;
    }

    protected override _removeAsync=async (fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined):Promise<VfsItem>=>
    {
        const r=await this.getHttpClient().deleteAsync<VfsItem>(this.getUrl(sourceUrl,'item'));
        if(!r){
            throw new Error('vfs api did not return a result');
        }
        this.setItemUrl(r);
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

    protected override _writeStringAsync=async (fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined,content:string):Promise<VfsItem>=>
    {
        const r=await this.getHttpClient().postAsync<VfsItem>(this.getUrl(sourceUrl,'string'),content);
        if(!r){
            throw new Error('Item not returned');
        }
        this.setItemUrl(r);
        return r;
    }

    protected override _appendStringAsync=async (fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined,content:string):Promise<VfsItem>=>
    {
        const r=await this.getHttpClient().putAsync<VfsItem>(this.getUrl(sourceUrl,'string'),content);
        if(!r){
            throw new Error('Item not returned');
        }
        this.setItemUrl(r);
        return r;
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

    protected override _writeBufferAsync=async (fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined,buffer:Uint8Array|Blob):Promise<VfsItem>=>
    {
        const r=await this.getHttpClient().postResponseAsync(this.getUrl(sourceUrl,'stream'),(buffer instanceof Blob)?buffer:new Blob([buffer]));
        if(!r){
            throw new Error('No http response returned')
        }
        const item=await r.json();
        this.setItemUrl(item);
        return item;
    }

    // protected override _writeStreamAsync=async (fs:VfsCtrl,mnt:VfsMntPt,path:string,sourceUrl:string|undefined,stream:VfsReadStream):Promise<VfsItem>=>
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
