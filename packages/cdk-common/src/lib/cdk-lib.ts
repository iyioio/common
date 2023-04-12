import { asArray } from "@iyio/common";
import * as db from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNodeJs from "aws-cdk-lib/aws-lambda-nodejs";
import * as logs from 'aws-cdk-lib/aws-logs';
import * as Path from "path";
import { Grantee } from "./common-cdk-types";

export const getCommonFnProps=(handlerFileName?:string):lambdaNodeJs.NodejsFunctionProps=>{


    return {
        entry:handlerFileName?(handlerFileName.includes('/')?
            handlerFileName:
            Path.join('src','handlers',handlerFileName)):undefined,
        bundling:{minify:true,sourceMap:true,target:'es2019'},
        handler:'handler',
        logRetention:logs.RetentionDays.ONE_WEEK,
        runtime:lambda.Runtime.NODEJS_18_X,
        architecture:lambda.Architecture.ARM_64,
        memorySize:256,
    }
};

export const grantTableQueryPerms=(grantee:Grantee, table:db.Table)=>{
    const getPolicy=()=>new iam.PolicyStatement({
        actions: ["dynamodb:Query"],
        resources: [`${table.tableArn}/index/*`],
    })
    grantee.addToRolePolicy?.(getPolicy());
    grantee.addToPolicy?.(getPolicy());
}

export const addPolicyToGrantee=(
    grantee:Grantee,
    getPolicy:()=>iam.PolicyStatement|null|undefined|(iam.PolicyStatement|null|undefined)[]
)=>{

    if(grantee.addToRolePolicy){
        const policies=asArray(getPolicy());
        if(policies){
            for(const policy of policies){
                if(policy){
                    grantee.addToRolePolicy(policy);
                }
            }
        }
    }

    if(grantee.addToPolicy){
        const policies=asArray(getPolicy());
        if(policies){
            for(const policy of policies){
                if(policy){
                    grantee.addToPolicy(policy);
                }
            }
        }
    }

}
