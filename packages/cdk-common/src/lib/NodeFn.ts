import { isRooted, joinPaths } from "@iyio/common";
import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNodeJs from "aws-cdk-lib/aws-lambda-nodejs";
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from "constructs";
import * as Path from "path";

export type NodeFnProps=Partial<lambdaNodeJs.NodejsFunctionProps> & AdditionalFuncOptions;

interface AdditionalFuncOptions
{
    /**
     * If true a public URL will be created for the function
     */
    createPublicUrl?:boolean;

    urlCors?:lambda.FunctionUrlCorsOptions;

    /**
     * A collection of IGrantables that are allowed to call the function. If not defined then
     * anybody is allowed to call the url.
     */
    publicUrlAccessors?:iam.IGrantable[]|false;

    handlerFileName?:string;

    minify?:boolean;
}

export interface CreateNodeFnResult
{
    name:string;
    func:lambdaNodeJs.NodejsFunction;
    url?:lambda.FunctionUrl;
}

export class NodeFn extends Construct{

    public readonly funcName:string;
    public readonly func:lambdaNodeJs.NodejsFunction;
    public readonly url?:lambda.FunctionUrl;

    public constructor(scope:Construct, name: string,{
        createPublicUrl,
        publicUrlAccessors,
        handlerFileName,
        minify=true,
        urlCors,

        entry=handlerFileName??Path.join('src','handlers',toFileName(name)),
        bundling={minify,sourceMap:true,target:'node18'},
        handler='handler',
        logRetention=logs.RetentionDays.ONE_WEEK,
        runtime=lambda.Runtime.NODEJS_18_X,
        architecture=lambda.Architecture.ARM_64,
        memorySize=256,
        ...props
    }:NodeFnProps){

        super(scope,name);

        if(isRooted(entry)){
            entry=joinPaths(process.cwd(),entry??'');
        }

        const func=new lambdaNodeJs.NodejsFunction(this,name,{
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
            url=func.addFunctionUrl({
                authType:publicUrlAccessors===undefined?
                    lambda.FunctionUrlAuthType.NONE:
                    lambda.FunctionUrlAuthType.AWS_IAM,
                cors:urlCors??{
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
            new cdk.CfnOutput(this,name+'Url',{value:url.url});
        }

        new cdk.CfnOutput(this,name+'FunctionName',{value:func.functionName});

        this.funcName=name;
        this.func=func;
        this.url=url;
    }
}



const toFileName=(name:string)=>name.replace(/([a-z0-9])([A-Z]+)/g,(_,l,u)=>`${l}-${u}`).toLocaleLowerCase()+'.ts';
