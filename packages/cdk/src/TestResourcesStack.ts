import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { createAuthFunc } from './createAuthFunc';
import { createDbCluster } from './createDbCluster';
import { createDynamoTables } from './createDynamoTables';
import { createUserPool } from './createUserPool';

export class TestResourcesStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const vpc=new ec2.Vpc(this,"TestingVpc");

        const {cognitoUserRole}=createUserPool(this);

        const bucket=new s3.Bucket(this,'TestBucket',{
            removalPolicy:cdk.RemovalPolicy.DESTROY
        });

        bucket.grantReadWrite(cognitoUserRole);
        new cdk.CfnOutput(this,'testBucketName',{value:bucket.bucketName});

        createAuthFunc(this,cognitoUserRole);

        createDbCluster(this,vpc);

        createDynamoTables(this,cognitoUserRole);

    }
}
