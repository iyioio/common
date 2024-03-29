import { rdsClusterArnParam, rdsDatabaseParam, rdsSecretArnParam } from "@iyio/aws-rds";
import * as cdk from "aws-cdk-lib";
import * as rds from "aws-cdk-lib/aws-rds";
import { Construct } from "constructs";

export const createDbCluster=(scope:Construct)=>
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
    });

    const rdsAdminCredentialsArn=dbCluster.secret?.secretArn;
    if(!rdsAdminCredentialsArn){
        throw new Error(`RDS full secret ARN is available. ${dbCluster.secret?'Has Secret':'NO secret'}`);
    }

    new cdk.CfnOutput(scope,rdsClusterArnParam.typeName+'Param',{value:dbCluster.clusterArn});
    new cdk.CfnOutput(scope,rdsSecretArnParam.typeName+'Param',{value:rdsAdminCredentialsArn});
    new cdk.CfnOutput(scope,rdsDatabaseParam.typeName+'Param',{value:defaultDatabaseName});

    return {
        dbCluster,
        rdsAdminCredentialsArn
    }
}
