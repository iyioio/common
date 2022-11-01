import { DeleteObjectCommand, GetObjectCommand, GetObjectCommandOutput, PutObjectCommand, S3Client, S3ClientConfig } from "@aws-sdk/client-s3";
import { IAwsAuthRef } from '@iyio/aws';
import { CancelToken, cf, DependencyContainer } from "@iyio/common";
import { BaseStore, BinaryStoreValue } from "@iyio/key-value-store";

export interface S3StoreConfig
{
    bucket:string;
}

export class S3Store<T=any> extends BaseStore<T>
{

    public static clientConfigFromDeps(deps:DependencyContainer):S3ClientConfig{
        return {
            region:cf(deps).get('AWS_REGION'),
            credentials:deps.get(IAwsAuthRef)?.getAuthProvider(deps),
        }
    }

    public readonly client:S3Client;

    public readonly bucket:string;

    public constructor(clientConfig:S3ClientConfig|DependencyContainer,{
        bucket
    }:S3StoreConfig){
        super();
        if(clientConfig instanceof DependencyContainer){
            clientConfig=S3Store.clientConfigFromDeps(clientConfig);
        }
        this.bucket=bucket;
        this.client=new S3Client(clientConfig);
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
