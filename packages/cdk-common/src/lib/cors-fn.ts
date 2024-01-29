import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";

export interface CorsOptions
{
    origins?:string[];
    headers?:string[];
    methods?:string[];
    maxAgeSeconds?:number;
    disableCredentials?:boolean;
}

export const createCorsFn=(scope:Construct,name:string,options:CorsOptions={}):lambda.Function=>{

    const headers={
        "Access-Control-Allow-Origin":options.origins?.join(',')??'*',
        "Access-Control-Allow-Headers":options.headers?.join(',')??'*',
        "Access-Control-Allow-Methods":options.methods?.join(',')??"OPTIONS,GET,PUT,POST,DELETE,PATCH,HEAD",
        "Access-Control-Max-Age":options.maxAgeSeconds?.toString()??"86400",
        "Access-Control-Allow-Credentials":options.disableCredentials?"false":"true",
    }

    return new lambda.Function(scope,name,{
        handler:'index.handler',
        runtime:lambda.Runtime.NODEJS_18_X,
        logRetention:logs.RetentionDays.ONE_DAY,
        code:new lambda.InlineCode(`
            exports.handler=async function handler(event) {
                return {
                    statusCode:200,
                    statusDescription:'200 Success',
                    headers:${JSON.stringify(headers)}
                }
            }`
        ),
    });
}
