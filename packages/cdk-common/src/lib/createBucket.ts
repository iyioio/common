import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export const createBucket=(scope:Construct,name:string, {
    enableCors,
    ...props
}:s3.BucketProps & {enableCors?:boolean})=>{
    return new s3.Bucket(scope, name,{
        cors:enableCors?[{
            allowedOrigins: ['*'],
            allowedMethods: [
                s3.HttpMethods.GET,
                s3.HttpMethods.PUT,
                s3.HttpMethods.HEAD,
                s3.HttpMethods.POST,
                s3.HttpMethods.DELETE,
            ],
            allowedHeaders: ["*"],
            maxAge: 60*60*24,
        }]:undefined,
        ...props
    });
}
