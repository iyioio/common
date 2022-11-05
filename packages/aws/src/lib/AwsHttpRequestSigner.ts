import { Sha256 } from '@aws-crypto/sha256-browser';
import { HttpRequest } from '@aws-sdk/protocol-http';
import { SignatureV4 } from "@aws-sdk/signature-v4";
import { BaseHttpRequest, IHttpRequestSigner, Scope, TypeDef } from '@iyio/common';
import { IAwsAuth } from './aws-auth';
import { awsHttpSignerServiceParam, awsRegionParam, IAwsAuthType } from './_types.aws';



export interface AwsHttpRequestSignerOptions
{
    awsAuthProviders:TypeDef<IAwsAuth>;
    region:string;
    service:string;//lambda
}

export class AwsHttpRequestSigner implements IHttpRequestSigner
{

    public static optionsFromScope(scope:Scope):AwsHttpRequestSignerOptions{
        return {
            awsAuthProviders:scope.to(IAwsAuthType),
            region:scope.require(awsRegionParam),
            service:scope.require(awsHttpSignerServiceParam),
        }
    }

    public static fromScope(scope:Scope){
        return new AwsHttpRequestSigner(AwsHttpRequestSigner.optionsFromScope(scope));
    }

    private readonly options:AwsHttpRequestSignerOptions;

    private signingPair:{signer:SignatureV4,creds:any}|null=null;

    public constructor(options:AwsHttpRequestSignerOptions)
    {
        this.options={...options}
    }

    public canSign(): boolean {
        return this.options.awsAuthProviders.get()?.getAuthProvider()?true:false;
    }

    public async sign(request: BaseHttpRequest): Promise<void> {

        const authProvider=this.options.awsAuthProviders.get();
        const credentials=authProvider?.getAuthProvider();
        if(!credentials){
            return;
        }


        if(!this.signingPair || credentials!==this.signingPair.creds){
            this.signingPair={
                signer:new SignatureV4({
                    credentials:credentials,
                    region:this.options.region,
                    service:this.options.service,
                    sha256:Sha256
                }),
                creds:credentials
            }
        }

        if(!request.headers){
            request.headers={}
        }

        const parts=/https?:\/\/([^/]*)/.exec(request.uri);
        if(!parts){
            throw new Error('url contains no host');
        }

        request.headers['host']=parts[1];

        const signed=await this.signingPair.signer.sign(new HttpRequest({
            ...request,
        }));

        if(signed.headers){
            request.headers={}
            for(const e in signed.headers){
                request.headers[e]=signed.headers[e];
            }
        }
    }

}
