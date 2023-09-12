import { ParamTypeDef } from "@iyio/common";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3Deployment from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from "constructs";
import { ManagedProps } from "./ManagedProps";
import { AccessGranter, IAccessGrantGroup } from "./cdk-types";
import { createBucket } from "./createBucket";

export interface BucketBuilderProps
{
    buckets:BucketInfo[];
    managed?:ManagedProps;
}

export interface BucketMountPath
{
    /**
     * The path where source content is located.
     */
    sourcePath:string;

    /**
     * The path where the content will be mounted in the bucket
     */
    mountPath:string
}

export interface BucketInfo
{
    name:string;
    public?:boolean;
    enableCors?:boolean;
    arnParam?:ParamTypeDef<string>;
    grantAccess?:boolean;
    modify?:(bucket:s3.Bucket)=>void;
    mountPaths?:BucketMountPath[];
    versioned?:boolean;
}

export interface BucketResult
{
    info:BucketInfo;
    bucket:s3.Bucket;
}

export class BucketBuilder extends Construct implements IAccessGrantGroup
{
    public readonly buckets:BucketResult[];

    public readonly accessGrants:AccessGranter[]=[];

    public constructor(scope:Construct, name:string, {
        buckets,
        managed:{
            params,
            accessManager,
            buckets:namedBuckets
        }={},
    }:BucketBuilderProps)
    {

        super(scope,name);

        const bucketInfos:BucketResult[]=[];


        for(const info of buckets){

            const bucket=createBucket(this,info.name,{
                enableCors:info.enableCors,
                versioned:info.versioned,
                blockPublicAccess:s3.BlockPublicAccess.BLOCK_ACLS,
            })

            namedBuckets?.push({
                name:info.name,
                bucket,
                public:info.public?true:false,
            })

            info.modify?.(bucket);

            if(info.public){
                bucket.grantPublicAccess();
            }

            if(info.arnParam){
                params?.setParam(info.arnParam,bucket.bucketArn);
            }

            if(info.grantAccess){
                this.accessGrants.push({
                    grantName:info.name,
                    grant:request=>{
                        if(request.types?.includes('read')){
                            bucket.grantRead(request.grantee);
                        }
                        if(request.types?.includes('write')){
                            bucket.grantPut(request.grantee);
                        }
                        if(request.types?.includes('delete')){
                            bucket.grantDelete(request.grantee);
                        }
                        if(request.types?.includes('list')){
                            bucket.addToResourcePolicy(new iam.PolicyStatement({
                                actions:['s3:List*'],
                                resources:[bucket.arnForObjects('*')],
                                principals:[request.grantee.grantPrincipal]
                            }))
                        }
                    }
                })
            }

            if(info.mountPaths){
                for(let i=0;i<info.mountPaths.length;i++){
                    const path=info.mountPaths[i];
                    if(!path){
                        continue;
                    }
                    new s3Deployment.BucketDeployment(this,info.name+"BukDeploy"+i,{
                        sources:[s3Deployment.Source.asset(path.sourcePath)],
                        destinationBucket:bucket,
                        destinationKeyPrefix:path.mountPath
                    });
                }
            }


            bucketInfos.push({
                info,
                bucket,
            })

        }

        this.buckets=bucketInfos;

        accessManager?.addGroup(this);
    }
}
