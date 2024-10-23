import { asArray, parseConfigBool } from "@iyio/common";
import { pathExistsSync } from "@iyio/node-common";
import { Duration } from 'aws-cdk-lib';
import * as db from "aws-cdk-lib/aws-dynamodb";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNodeJs from "aws-cdk-lib/aws-lambda-nodejs";
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from "constructs";
import { mkdirSync } from "fs";
import { tmpdir } from 'os';
import * as Path from "path";
import { Grantee } from "./cdk-types";

export const cdkUseCachedOutputs=parseConfigBool(process.env['NX_CDK_USE_CACHED_OUTPUTS']);

export const cdkOutputCache='output-cache';

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

export const grantTableScanPerms=(grantee:Grantee, table:db.Table)=>{
    const getPolicy=()=>new iam.PolicyStatement({
        actions: ["dynamodb:Scan"],
        resources: [`${table.tableArn}`],
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

let defaultVpc:ec2.IVpc|null=null;

/**
 * Returns the default VPC for the current deployment. If the default VPC is not explicity defined
 * using the setDefaultVpc function you must define the account and region in the env of the stack
 * in-order to use this function.
 *
 * const app = new cdk.App();
 * new ExampleStack(app, "Example", {
 *     env:{account:"123456789012",region:"us-east-1"}
 * })
 * @param scope
 * @param name
 * @returns
 */
export const getDefaultVpc=(scope:Construct,name='DefaultVpc')=>{
    if(!defaultVpc){
        defaultVpc=ec2.Vpc.fromLookup(scope,name,{isDefault:true});
    }
    return defaultVpc;
}

export const setDefaultVpc=(vpc:ec2.IVpc)=>{
    if(vpc===defaultVpc){
        return;
    }
    if(defaultVpc){
        throw new Error('Default VPC already set')
    }
    defaultVpc=vpc;
}


export const secondsToCdkDuration=(seconds:string|number|null|undefined):Duration|undefined=>{
    switch(typeof seconds){
        case 'number':
            return Duration.seconds(seconds);

        case 'string':{
            const n=Number(seconds);
            return isFinite(n)?Duration.seconds(n):undefined;
        }

        default:
            return undefined;
    }
}

let tmpCdkDir:string|null;;
export const setTmpCdkDir=(dir:string)=>{
    tmpCdkDir=dir;
}
export const getTmpCdkDir=(autoCreate=false)=>{
    if(!tmpCdkDir){
        tmpCdkDir=tmpdir();
    }
    if(autoCreate && !pathExistsSync(tmpCdkDir)){
        mkdirSync(tmpCdkDir,{recursive:true});
    }
    return tmpCdkDir;
}
