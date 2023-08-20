import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export const createAuthFunc=(scope:Construct,role:iam.Role)=>{
    const authFunc=new lambda.Function(scope,'authFunc',{
        code: new lambda.InlineCode(`
            exports.handler=function(){
                return {
                    statusCode:200,
                    headers: {
                        "Content-Type": "application/json",
                        Server: 'iyio-testing'
                    },
                    body: JSON.stringify({ok:"bob"}),
                }
            }
        `),
        handler: 'index.handler',
        runtime: lambda.Runtime.NODEJS_16_X,
        logRetention:logs.RetentionDays.ONE_WEEK
    });

    const authUrl=authFunc.addFunctionUrl({
        authType:lambda.FunctionUrlAuthType.AWS_IAM,
        cors:{
            allowCredentials:true,
            allowedHeaders:['*'],
            allowedMethods:[lambda.HttpMethod.ALL],
            allowedOrigins:['*'],
            maxAge:cdk.Duration.days(1),
        }
    });

    authFunc.grantInvoke(role);
    authUrl.grantInvokeUrl(role);

    new cdk.CfnOutput(scope,'authFuncUrlParam',{value:authUrl.url});

    return {authFunc,authUrl}
}
