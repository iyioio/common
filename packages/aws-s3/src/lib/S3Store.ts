import { DeleteObjectCommand, GetObjectCommand, GetObjectCommandOutput, PutObjectCommand, S3Client, S3ClientConfig } from "@aws-sdk/client-s3";
import { awsRegionParam, IAwsAuthType } from '@iyio/aws';
import { CancelToken, Scope } from "@iyio/common";
import { BaseStore, BinaryStoreValue } from "@iyio/key-value-store";

export interface S3StoreConfig
{
    bucket:string;
}

export class S3Store<T=any> extends BaseStore<T>
{

    public static fromScope<T=any>(scope:Scope,config:S3StoreConfig)
    {
        return new S3Store<T>({
            region:awsRegionParam(scope),
            credentials:scope.get(IAwsAuthType)?.getAuthProvider(scope)
        },config)
    }

    public readonly client:S3Client;

    public readonly bucket:string;

    public readonly clientConfig:Readonly<S3ClientConfig>;

    public constructor(clientConfig:S3ClientConfig,{
        bucket
    }:S3StoreConfig){
        super();
        this.bucket=bucket;
        this.client=new S3Client(clientConfig);
        this.clientConfig=clientConfig;
    }

    public async getAsync(key:string,cancel?:CancelToken):Promise<T|undefined>
    {
        let r:GetObjectCommandOutput;

        try{
            r=await this.client.send(new GetObjectCommand({
                Key:key,
                Bucket:this.bucket,
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


    public async putAsync(key:string,value:T):Promise<T>
    {
        await this.client.send((value instanceof BinaryStoreValue)?
            new PutObjectCommand({
                Key:key,
                Bucket:this.bucket,
                Body:value.content,
                ContentType:value.contentType,
            })
        :
            new PutObjectCommand({
                Key:key,
                Bucket:this.bucket,
                Body:JSON.stringify(value),
                ContentType:'application/json',
            })
        )

        return value;
    }

    public async deleteAsync(key:string):Promise<boolean|undefined>
    {
        await this.client.send(new DeleteObjectCommand({
            Key:key,
            Bucket:this.bucket,
        }));

        return true;
    }
}
