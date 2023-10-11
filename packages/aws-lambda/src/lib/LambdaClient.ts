import { LambdaClient as AwsLambdaClient, InvokeCommand, LambdaClientConfig } from "@aws-sdk/client-lambda";
import { AwsAuthProviders, awsRegionParam } from "@iyio/aws";
import { AuthDependentClient, FnInvokeEvent, Scope, ValueCache, authService, currentBaseUser, getZodErrorMessage, isFnError } from "@iyio/common";
import { LambdaInvokeOptions } from "./lambda-types";



const encoder=new TextEncoder();
const decoder=new TextDecoder();

export class LambdaClient extends AuthDependentClient<AwsLambdaClient>
{

    public static fromScope(scope:Scope)
    {
        return new LambdaClient({
            region:awsRegionParam(scope),
            credentials:scope.get(AwsAuthProviders)?.getAuthProvider()
        },authService(scope).userDataCache)
    }

    public readonly clientConfig:Readonly<LambdaClientConfig>;

    public constructor(clientConfig:LambdaClientConfig,userDataCache:ValueCache){

        super(userDataCache);
        this.clientConfig=clientConfig;
    }

    protected override createAuthenticatedClient(): AwsLambdaClient {
        return new AwsLambdaClient(this.clientConfig);
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
        label,
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
            if(parsed.success===true){
                input=parsed.data;
            }else if(parsed.success===false){
                throw new Error(getZodErrorMessage(parsed.error));
            }else{
                throw new Error('Invalid zod parse result');
            }
        }

        const user=currentBaseUser(scope);

        const eventInput:FnInvokeEvent={
            label,
            ______isFnInvokeEvent:true,
            input,
            jwt:user?(await user.getJwtAsync())??undefined:undefined
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

        if(isFnError(output)){
            throw output;
        }

        if(outputScheme){
            const parsed=outputScheme.safeParse(output);
            if(parsed.success===true){
                output=parsed.data;
            }else if(parsed.success===false){
                throw new Error(getZodErrorMessage(parsed.error));
            }else{
                throw new Error('Invalid zod parse result');
            }
        }

        return output;

    }
}
