import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
// import * as ec2 from 'aws-cdk-lib/aws-ec2';
// import * as efs from 'aws-cdk-lib/aws-efs';
// import * as lambda from 'aws-cdk-lib/aws-lambda';
// import * as s3Deployment from 'aws-cdk-lib/aws-s3-deployment';
// import * as secrets from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export class TestResourcesStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        new s3.Bucket(this, 'test', {
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });
    }
}
