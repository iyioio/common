import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNodeJs from "aws-cdk-lib/aws-lambda-nodejs";
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from "constructs";
import * as Path from "path";

export const createNodeFn=(scope:Construct, name: string,{
        createPublicUrl,
        publicUrlAccessors,
        handlerFileName,

        entry=handlerFileName?undefined:Path.join('src','handlers',toFileName(name)),
        bundling={minify:true,sourceMap:true,target:'es2019'},
        handler='handler',
        logRetention=logs.RetentionDays.ONE_WEEK,
        runtime=lambda.Runtime.NODEJS_18_X,
        architecture=lambda.Architecture.ARM_64,
        memorySize=256,
        ...props
}:Partial<lambdaNodeJs.NodejsFunctionProps> & AdditionalFuncOptions={}):CreateNodeFnResult=>{

    const func=new lambdaNodeJs.NodejsFunction(scope,name,{
        entry,
        bundling,
        handler,
        logRetention,
        runtime,
        architecture,
        memorySize,
        ...props
    });

    let url:lambda.FunctionUrl|undefined=undefined;

    if(createPublicUrl){
        url = func.addFunctionUrl({
            authType:publicUrlAccessors===undefined?
                lambda.FunctionUrlAuthType.NONE:
                lambda.FunctionUrlAuthType.AWS_IAM,
            cors:{
                allowCredentials:true,
                allowedHeaders:['*'],
                allowedMethods:[lambda.HttpMethod.ALL],
                allowedOrigins:['*'],
                maxAge:cdk.Duration.days(1),
            }
        });
        if(publicUrlAccessors){
            for(const a of publicUrlAccessors){
                url.grantInvokeUrl(a);
            }
        }else if(publicUrlAccessors!==false){
            url.grantInvokeUrl(new iam.AnyPrincipal());
        }
        new cdk.CfnOutput(scope,"funcUrl00"+name,{value:url.url});
    }

    new cdk.CfnOutput(scope,"funcName00"+name,{value:func.functionName});
    return {name,func,url};
}

export interface AdditionalFuncOptions
{
    /**
     * If true a public URL will be created for the function
     */
    createPublicUrl?:boolean;

    /**
     * A collection of IGrantables that are allowed to call the function. If not defined then
     * anybody is allowed to call the url.
     */
    publicUrlAccessors?:iam.IGrantable[]|false;

    handlerFileName?:string;
}

export interface CreateNodeFnResult
{
    name:string;
    func:lambdaNodeJs.NodejsFunction;
    url?:lambda.FunctionUrl;
}

const toFileName=(name:string)=>name.replace(/([a-z0-9])([A-Z]+)/g,(_,l,u)=>`${l}-${u}`).toLocaleLowerCase()+'.ts';
