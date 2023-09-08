import { GetSecretValueCommand, SecretsManagerClient, SecretsManagerClientConfig } from "@aws-sdk/client-secrets-manager";
import { AwsAuthProviders, awsRegionParam } from "@iyio/aws";
import { Scope, SecretManager, rootScope } from "@iyio/common";


export class AwsSecretManager implements SecretManager
{

    public static fromScope(scope:Scope)
    {
        return new AwsSecretManager({
            region:awsRegionParam(scope),
            credentials:scope.get(AwsAuthProviders)?.getAuthProvider()
        })
    }

    public constructor(clientConfig:SecretsManagerClientConfig)
    {
        this.clientConfig=clientConfig;
    }


    private readonly clientConfig:SecretsManagerClientConfig;
    private client:SecretsManagerClient|null=null;

    public getClient():SecretsManagerClient{
        if(this.client){
            return this.client;
        }

        this.client=new SecretsManagerClient({
            region:awsRegionParam(),
            credentials:rootScope.get(AwsAuthProviders)?.getAuthProvider()
        });

        return this.client;
    }


    private readonly cache:Record<string,string>={}

    public async getSecretAsync(name:string,cache:boolean):Promise<string|undefined>{
        if(cache && this.cache[name]!==undefined){
            return this.cache[name];
        }

        const client=this.getClient();

        const cmd=new GetSecretValueCommand({
            SecretId:name
        })

        const r=await client.send(cmd);

        if(r.SecretString){
            if(cache){
                this.cache[name]=r.SecretString;
            }
            return r.SecretString;
        }else{
            throw new Error(`Unable to get secret value with arn - ${name}`);
        }
    }

    public async getSecretTAsync<T>(name:string,cache:boolean):Promise<T|undefined>{
        const json=await this.getSecretAsync(name,cache);
        if(json===undefined){
            return undefined;
        }

        try{
            return JSON.parse(json);
        }catch(ex){
            console.error(`Secret value is not valid json. name:${name}`);
            return undefined;
        }
    }
    public async requireSecretAsync(name:string,cache:boolean):Promise<string>{
        const secret=await this.getSecretAsync(name,cache);
        if(secret===undefined){
            throw new Error(`secret ${name} not found`);
        }
        return secret;
    }
    public async requireSecretTAsync<T>(name:string,cache:boolean):Promise<T>{
        const secret=await this.getSecretTAsync<T>(name,cache);
        if(secret===undefined){
            throw new Error(`secret ${name} not found`);
        }
        return secret;
    }
}
