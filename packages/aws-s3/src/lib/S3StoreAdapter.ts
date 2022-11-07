import { BaseStore, CancelToken, StoreKeyScope } from "@iyio/common";
import { S3Client } from "./S3Client";



export interface S3StoreAdapterOptions extends StoreKeyScope
{
    /**
     * The default bucket to use
     */
    bucket?:string;
}

export class S3StoreAdapter<T=any> extends BaseStore<T>
{

    private readonly client:S3Client;

    private readonly options:S3StoreAdapterOptions;

    public constructor(client:S3Client,options:S3StoreAdapterOptions)
    {
        super(options);
        this.client=client;
        this.options={...options};
    }

    private parseKey(key:string){
        if(this.options.bucket){
            return {
                mappedBucket:this.options.bucket,
                mappedKey:key
            }
        }else{
            const [bucket,objKey]=key.split('/',2)
            return {
                mappedBucket:bucket,
                mappedKey:objKey||'NO_KEY'
            }
        }
    }

    public async getAsync(key:string,cancel?:CancelToken):Promise<T|undefined>
    {
        const {mappedBucket,mappedKey}=this.parseKey(key);
        return await this.client.getAsync(mappedBucket,mappedKey,cancel);
    }


    public async putAsync(key:string,value:T):Promise<void>
    {
        const {mappedBucket,mappedKey}=this.parseKey(key);
        await this.client.putAsync(mappedBucket,mappedKey,value);
    }

    public async deleteAsync(key:string):Promise<boolean|undefined>
    {
        const {mappedBucket,mappedKey}=this.parseKey(key);
        return await this.client.deleteAsync(mappedBucket,mappedKey);
    }
}
