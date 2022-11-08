import { DeleteObjectCommand, GetObjectCommand, GetObjectCommandOutput, PutObjectCommand, S3Client as AwsS3Client, S3ClientConfig } from "@aws-sdk/client-s3";
import { AwsAuthProviders, awsRegionParam } from '@iyio/aws';
import { BaseStore, BinaryStoreValue, CancelToken, IWithStoreAdapter, Scope } from "@iyio/common";
import { S3StoreAdapter, S3StoreAdapterOptions } from "./S3StoreAdapter";



export class S3Client<T=any> extends BaseStore<T> implements IWithStoreAdapter
{

    public static fromScope<T=any>(scope:Scope,storeAdapterOptions?:S3StoreAdapterOptions)
    {
        return new S3Client<T>({
            region:awsRegionParam(scope),
            credentials:scope.get(AwsAuthProviders)?.getAuthProvider()
        },storeAdapterOptions)
    }

    public readonly clientConfig:Readonly<S3ClientConfig>;

    public constructor(
        clientConfig:S3ClientConfig,
        storeAdapterOptions:S3StoreAdapterOptions={}
    ){
        super();

        this.storeAdapterOptions=storeAdapterOptions;

        this.clientConfig=clientConfig;
    }

    private client:AwsS3Client|null=null;
    public getClient():AwsS3Client{
        if(this.client){
            return this.client;
        }
        this.client=new AwsS3Client(this.clientConfig);
        return this.client;
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

    public async getAsync(bucket:string,key:string,cancel?:CancelToken):Promise<T|undefined>
    {
        let r:GetObjectCommandOutput;

        try{
            r=await this.getClient().send(new GetObjectCommand({
                Key:key,
                Bucket:bucket,
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


    public async putAsync(bucket:string,key:string,value:T):Promise<void>
    {
        await this.getClient().send((value instanceof BinaryStoreValue)?
            new PutObjectCommand({
                Key:key,
                Bucket:bucket,
                Body:value.content,
                ContentType:value.contentType,
            })
        :
            new PutObjectCommand({
                Key:key,
                Bucket:bucket,
                Body:JSON.stringify(value),
                ContentType:'application/json',
            })
        )
    }

    public async deleteAsync(bucket:string,key:string):Promise<boolean|undefined>
    {
        await this.getClient().send(new DeleteObjectCommand({
            Key:key,
            Bucket:bucket,
        }));

        return true;
    }
}
