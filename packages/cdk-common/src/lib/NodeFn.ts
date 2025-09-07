import { isRooted, joinPaths } from "@iyio/common";
import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNodeJs from "aws-cdk-lib/aws-lambda-nodejs";
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from "constructs";
import { existsSync } from "fs";
import * as Path from "path";
import { ManagedProps } from "./ManagedProps";
import { getDefaultVpc } from "./cdk-lib";

export type NodeFnProps=Partial<Omit<lambdaNodeJs.NodejsFunctionProps,'vpc'>> & AdditionalFuncOptions;

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

    bundledHandlerFileNames?:string[];

    handlerFileName?:string;

    minify?:boolean;

    /**
     * Timeout in milliseconds. If timeout is defined this value will be overrode.
     */
    timeoutMs?:number;

    vpc?:ec2.IVpc|boolean;

    /**
     * If true the function can be an event target and be invoked by EventBridge
     */
    eventTarget?:boolean;

    /**
     * If true the function can create scheduled events
     */
    createScheduledEvents?:boolean;

    managed?:ManagedProps;

    layerInfos?:NodeFnLayerInfo[];

    /**
     * If true logging for the function will be enabled even if logging is disabled for the deployment
     */
    forceLogging?:boolean;
}

export interface NodeFnLayerInfo{
    name?:string;
    path:string;
}

export interface CreateNodeFnResult
{
    name:string;
    func:lambda.Function;
    url?:lambda.FunctionUrl;
}

export class NodeFn extends Construct{

    public readonly funcName:string;
    public readonly func:lambda.Function;
    public readonly url?:lambda.FunctionUrl;

    public constructor(scope:Construct, name: string,{
        createPublicUrl,
        publicUrlAccessors,
        handlerFileName,
        bundledHandlerFileNames,
        minify=true,
        urlCors,
        timeoutMs,
        vpc,
        eventTarget,
        createScheduledEvents,

        entry=handlerFileName??Path.join('src','handlers',toFileName(name)),
        bundling={minify,sourceMap:true,target:'node18',externalModules:['@aws-sdk/*','sharp']},
        handler,
        logRetention=logs.RetentionDays.ONE_WEEK,
        runtime=lambda.Runtime.NODEJS_18_X,
        architecture=lambda.Architecture.ARM_64,
        memorySize=256,
        timeout=timeoutMs===undefined?undefined:cdk.Duration.millis(timeoutMs),
        managed,
        layerInfos,
        forceLogging,
        ...props
    }:NodeFnProps){

        super(scope,name);

        let role:iam.Role|undefined;
        if(vpc===true){
            vpc=getDefaultVpc(this);
        }

        if(isRooted(entry)){
            entry=joinPaths(process.cwd(),entry??'');
        }

        let func:lambda.Function|null=null;

        const options:Omit<lambda.FunctionProps,'code'|'handler'>={
            architecture,
            memorySize,
            timeout,
            runtime,
            vpc:vpc||undefined,
            role,
            ...props,
            layers:layerInfos?([
                ...(props.layers??[]),
                ...layerInfos.map(p=>{
                    let name=p.name;
                    if(!name){
                        const parts=p.path.split('.');
                        name=parts[parts.length-1]??''
                    }
                    return new lambda.LayerVersion(this,name,{
                        code:lambda.Code.fromAsset(p.path),
                        compatibleArchitectures:[architecture]
                    })
            }),
            ]):props.layers,
        }

        if(!useDefaultLogGroup && (!disableLogging || forceLogging)){
            (options as any).logRetention=logRetention;
        }

        if(bundledHandlerFileNames){
            for(const fName of bundledHandlerFileNames){
                if(!existsSync(fName)){
                    continue;
                }

                func=new lambda.Function(this,name,{
                    code:lambda.Code.fromAsset(fName),
                    handler:handler??'index.handler',
                    environment:{
                        AWS_NODEJS_CONNECTION_REUSE_ENABLED:'1',
                        ...options.environment,
                    },
                    ...options,
                })
                break;
            }
            if(!func){
                console.warn('!!!!!!!!!!!!!! No func files found in bundledHandlerFileNames. Try building all packages')
            }
        }

        if(!func){
            func=new lambdaNodeJs.NodejsFunction(this,name,{
                entry,
                bundling,
                handler:handler??'handler',
                ...options,
            });
        }

        if(useDefaultLogGroup && !disableLogging){
            //func.logGroup=getDefaultLogGroup(this,logRetention); // todo after update CDK version
        }

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

        if(eventTarget){
            const role=managed?.getEventBridgeLambdaInvokeRole?.();
            if(role){
                func.grantInvoke(role);
            }
        }

        if(createScheduledEvents){
            func.addToRolePolicy(new iam.PolicyStatement({
                actions:['scheduler:*','iam:PassRole'],
                resources:['*']
            }))
        }

        new cdk.CfnOutput(this,name+'FunctionName',{value:func.functionName});

        this.funcName=name;
        this.func=func;
        this.url=url;
    }
}



const toFileName=(name:string)=>name.replace(/([a-z0-9])([A-Z]+)/g,(_,l,u)=>`${l}-${u}`).toLocaleLowerCase()+'.ts';

let defaultLogGroup:logs.ILogGroup|null=null;

let useDefaultLogGroup=false;
let disableLogging=false;

export const setDisableNodeFnLogging=(disable:boolean)=>{
    disableLogging=disable;
}

export const setUseDefaultLogGroup=(use:boolean)=>{
    useDefaultLogGroup=use;
}

const getDefaultLogGroup=(scope:Construct,retention=logs.RetentionDays.ONE_WEEK)=>{
    return defaultLogGroup??(defaultLogGroup=new logs.LogGroup(scope,'DefaultLogGroup',{retention}));
}
