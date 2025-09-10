import { ManagedStack } from '@iyio/cdk-common';
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { createAuthFunc } from './createAuthFunc.js';
import { createDbCluster } from './createDbCluster.js';
import { createDynamoTables } from './createDynamoTables.js';
import { createObjSyncTestResources } from './createObjSyncTestResources.js';
import { createUserPool } from './createUserPool.js';

export class TestResourcesStack extends ManagedStack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const {cognitoUserRole}=createUserPool(this);

        const bucket=new s3.Bucket(this,'TestBucket',{
            removalPolicy:cdk.RemovalPolicy.DESTROY
        });

        bucket.grantReadWrite(cognitoUserRole);
        new cdk.CfnOutput(this,'testBucketNameParam',{value:bucket.bucketName});

        createAuthFunc(this,cognitoUserRole);

        createDbCluster(this);

        createDynamoTables(this,cognitoUserRole);

        createObjSyncTestResources(this);

        this.generateOutputs();

    }
}
