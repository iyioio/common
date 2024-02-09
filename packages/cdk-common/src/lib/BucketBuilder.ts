import { ParamTypeDef } from "@iyio/common";
import * as cf from "aws-cdk-lib/aws-cloudfront";
import * as cfo from "aws-cdk-lib/aws-cloudfront-origins";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3Deployment from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from "constructs";
import { ManagedProps, getDefaultManagedProps } from "./ManagedProps";
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
    website?:boolean;
    disableWebsiteCache?:boolean;
    websiteParam?:ParamTypeDef<string>;
    websiteIndexDocument?:string;
    websiteErrorDocument?:string;
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
            buckets:namedBuckets,
            resources,
        }=getDefaultManagedProps(),
    }:BucketBuilderProps)
    {

        super(scope,name);

        const bucketInfos:BucketResult[]=[];


        for(const info of buckets){

            const bucket=createBucket(this,info.name,{
                enableCors:info.enableCors,
                versioned:info.versioned,
                blockPublicAccess:s3.BlockPublicAccess.BLOCK_ACLS,
                websiteErrorDocument:info.websiteErrorDocument,
                websiteIndexDocument:info.websiteIndexDocument,
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

            if(info.website){
                const originAccessIdentity=new cf.OriginAccessIdentity(this,info.name+'Oai');
                bucket.grantRead(originAccessIdentity);

                const dist=new cf.Distribution(this,info.name+'Dist',{
                    defaultRootObject:'index.html',
                    errorResponses:[
                        {
                            httpStatus:404,
                            responseHttpStatus:200,
                            responsePagePath:'/index.html'
                        },
                        {
                            httpStatus:403,
                            responseHttpStatus:200,
                            responsePagePath:'/index.html'
                        },
                    ],
                    defaultBehavior:{
                        origin:new cfo.S3Origin(bucket,{originAccessIdentity}),
                        cachePolicy:info.disableWebsiteCache?cf.CachePolicy.CACHING_DISABLED:undefined,
                    },
                });

                if(info.websiteParam && params){
                    params.setParam(info.websiteParam,`https://${dist.distributionDomainName}`);
                }
            }


            bucketInfos.push({
                info,
                bucket,
            })

            resources.push({name:info.name,bucket});

        }

        this.buckets=bucketInfos;

        accessManager?.addGroup(this);
    }
}
