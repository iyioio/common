import { LambdaClient as AwsLambdaClient, InvokeCommand, LambdaClientConfig } from "@aws-sdk/client-lambda";
import { AwsAuthProviders, awsRegionParam } from "@iyio/aws";
import { FnInvokeEvent, Scope, authService, currentBaseUser, getZodErrorMessage } from "@iyio/common";
import { LambdaInvokeOptions } from "./lambda-types";



const encoder=new TextEncoder();
const decoder=new TextDecoder();

export class LambdaClient
{

    public static fromScope(scope:Scope)
    {
        return new LambdaClient({
            region:awsRegionParam(scope),
            credentials:scope.get(AwsAuthProviders)?.getAuthProvider()
        })
    }

    public readonly clientConfig:Readonly<LambdaClientConfig>;

    public constructor(clientConfig:LambdaClientConfig){

        this.clientConfig=clientConfig;
    }

    private client:AwsLambdaClient|null=null;
    public getClient():AwsLambdaClient{
        if(this.client){
            return this.client;
        }
        this.client=new AwsLambdaClient(this.clientConfig);
        return this.client;
    }

    public async invokeAsync<TInput,TOutput>(options:LambdaInvokeOptions<TInput>):Promise<TOutput>
    {
        const output=await this.invokeOptionalOutAsync<TInput,TOutput>(options);
        if(output===undefined){
            throw new Error(`No output returned by function - ${options.fn}`);
        }
        return output;
    }

    public async invokeNoOutAsync<TInput,TOutput>(options:LambdaInvokeOptions<TInput>):Promise<void>
    {
        await this.invokeOptionalOutAsync<TInput,TOutput>(options);
    }

    public async invokeOptionalOutAsync<TInput,TOutput>({
        fn,
        input,
        inputScheme,
        outputScheme,
        passRawInput,
        scope
    }:LambdaInvokeOptions<TInput>):Promise<TOutput|undefined>
    {

        const client=this.getClient();

        if(inputScheme){
            const parsed=inputScheme.safeParse(input);
            if(parsed.success){
                input=parsed.data;
            }else{
                throw new Error(getZodErrorMessage(parsed.error));
            }
        }

        const user=currentBaseUser(scope);

        const eventInput:FnInvokeEvent={
            ______isFnInvokeEvent:true,
            input,
            jwt:user?(await authService(scope).getJwtAsync(user))??undefined:undefined
        }

        const cmd=new InvokeCommand({
            FunctionName:fn,
            Payload:passRawInput?
                input===undefined?undefined:encoder.encode(JSON.stringify(input)):
                encoder.encode(JSON.stringify(eventInput))
        });

        const result=await client.send(cmd);

        let output:any;
        if(result.Payload){
            output=JSON.parse(decoder.decode(result.Payload));
        }else{
            output=undefined;
        }

        if(outputScheme){
            const parsed=outputScheme.safeParse(output);
            if(parsed.success){
                output=parsed.data;
            }else{
                throw new Error(getZodErrorMessage(parsed.error));
            }
        }

        return output;

    }
}
