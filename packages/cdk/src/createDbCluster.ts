import { rdsClusterArnParam, rdsDatabaseParam, rdsSecretArnParam } from "@iyio/aws-rds";
import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import { Construct } from "constructs";

export const createDbCluster=(scope:Construct, vpc:ec2.Vpc)=>
{

    const defaultDatabaseName='TestingDatabase';

    const dbCluster = new rds.ServerlessCluster(scope, 'TestingRds', {
        engine:rds.DatabaseClusterEngine.auroraPostgres({version:rds.AuroraPostgresEngineVersion.VER_11_13}),
        enableDataApi:true,
        defaultDatabaseName,
        scaling:{
            minCapacity:2,
            maxCapacity:2,
            autoPause:cdk.Duration.minutes(5)
        },
        vpc,
    });

    const rdsAdminCredentialsArn=dbCluster.secret?.secretArn;
    if(!rdsAdminCredentialsArn){
        throw new Error(`RDS full secret ARN is available. ${dbCluster.secret?'Has Secret':'NO secret'}`);
    }

    new cdk.CfnOutput(scope,rdsClusterArnParam.typeName,{value:dbCluster.clusterArn});
    new cdk.CfnOutput(scope,rdsSecretArnParam.typeName,{value:rdsAdminCredentialsArn});
    new cdk.CfnOutput(scope,rdsDatabaseParam.typeName,{value:defaultDatabaseName});

    return {
        dbCluster,
        rdsAdminCredentialsArn
    }
}
