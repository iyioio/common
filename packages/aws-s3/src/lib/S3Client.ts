import { S3Client as AwsS3Client, DeleteObjectCommand, GetObjectCommand, GetObjectCommandOutput, PutObjectCommand, S3ClientConfig } from "@aws-sdk/client-s3";
import { AwsAuthProviders, awsRegionParam } from '@iyio/aws';
import { AuthDependentClient, BinaryStoreValue, CancelToken, IWithStoreAdapter, Scope, ValueCache, authService } from "@iyio/common";
import { S3StoreAdapter, S3StoreAdapterOptions } from "./S3StoreAdapter";



export class S3Client extends AuthDependentClient<AwsS3Client> implements IWithStoreAdapter
{

    public static fromScope(scope:Scope,storeAdapterOptions?:S3StoreAdapterOptions)
    {
        return new S3Client({
            region:awsRegionParam(scope),
            credentials:scope.get(AwsAuthProviders)?.getAuthProvider()
        },authService(scope).userDataCache,storeAdapterOptions)
    }

    public readonly clientConfig:Readonly<S3ClientConfig>;

    public constructor(
        clientConfig:S3ClientConfig,
        userDataCache:ValueCache<any>,
        storeAdapterOptions:S3StoreAdapterOptions={}
    ){
        super(userDataCache);
        this.storeAdapterOptions=storeAdapterOptions;

        this.clientConfig=clientConfig;
    }

    protected override createAuthenticatedClient():AwsS3Client{
        return new AwsS3Client(this.clientConfig);
    }


    private readonly storeAdapterOptions:S3StoreAdapterOptions;
    private storeAdapter:S3StoreAdapter|null=null;
    public getStoreAdapter():S3StoreAdapter
    {
        if(this.storeAdapter){
            return this.storeAdapter;
        }
        this.storeAdapter=new S3StoreAdapter(this,this.storeAdapterOptions);
        return this.storeAdapter;
    }

    public async getAsync<T>(bucket:string,key:string,cancel?:CancelToken):Promise<T|undefined>
    {
        let r:GetObjectCommandOutput;

        try{
            r=await this.getClient().send(new GetObjectCommand({
                Key:key,
                Bucket:formatBucketName(bucket),
                ResponseCacheControl:"no-cache"
            }));
        }catch(ex){
            if((ex as any)?.Code==='NoSuchKey'){
                return undefined;
            }
            throw ex;
        }

        if(cancel?.isCanceled){
            return;
        }

        const contentType=r.ContentType?.toLocaleLowerCase()??'';
        if(contentType==='application/json' || contentType.startsWith('text/')){
            if(contentType.endsWith('/json')){
                if(r.Body){
                    return JSON.parse(await r.Body.transformToString())
                }else{
                    return undefined;
                }
            }else{
                return r.Body?.toString() as any;
            }
        }else{
            if(r.Body){
                return new BinaryStoreValue(
                    r.ContentType??'application/octet-stream',
                    await r.Body.transformToByteArray()
                ) as any;
            }else{
                return undefined;
            }
        }
    }

    public async getStringAsync(bucket:string,key:string,cancel?:CancelToken):Promise<string|undefined>
    {
        let r:GetObjectCommandOutput;

        try{
            r=await this.getClient().send(new GetObjectCommand({
                Key:key,
                Bucket:formatBucketName(bucket),
                ResponseCacheControl:"no-cache"
            }));
        }catch(ex){
            if((ex as any)?.Code==='NoSuchKey'){
                return undefined;
            }
            throw ex;
        }

        if(cancel?.isCanceled){
            return undefined;
        }

        if(r.Body){
            return await r.Body.transformToString();
        }else{
            return undefined;
        }
    }


    public async putAsync<T>(bucket:string,key:string,value:T):Promise<void>
    {
        await this.getClient().send((value instanceof BinaryStoreValue)?
            new PutObjectCommand({
                Key:key,
                Bucket:formatBucketName(bucket),
                Body:value.content,
                ContentType:value.contentType,
            })
        :
            new PutObjectCommand({
                Key:key,
                Bucket:formatBucketName(bucket),
                Body:JSON.stringify(value),
                ContentType:'application/json',
            })
        )
    }

    public async putStringAsync(bucket:string,key:string,contentType:string,value:string):Promise<void>
    {
        await this.getClient().send(
            new PutObjectCommand({
                Key:key,
                Bucket:formatBucketName(bucket),
                Body:value,
                ContentType:contentType,
            })
        )
    }

    public async deleteAsync(bucket:string,key:string):Promise<boolean|undefined>
    {
        await this.getClient().send(new DeleteObjectCommand({
            Key:key,
            Bucket:formatBucketName(bucket),
        }));

        return true;
    }
}

export const formatBucketName=(name:string)=>{
    const i=name.lastIndexOf(':');
    return i===-1?name:name.substring(i+1);
}
