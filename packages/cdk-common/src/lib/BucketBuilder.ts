import { ParamTypeDef } from "@iyio/common";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import { AccessGranter, IAccessGrantGroup } from "./cdk-types";
import { createBucket } from "./createBucket";
import { ManagedProps } from "./ManagedProps";

export interface BucketBuilderProps
{
    buckets:BucketInfo[];
    managed?:ManagedProps;
}

export interface BucketInfo
{
    name:string;
    public?:boolean;
    enableCors?:boolean;
    arnParam?:ParamTypeDef<string>;
    grantAccess?:boolean;
    modify?:(bucket:s3.Bucket)=>void;
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
        }={},
    }:BucketBuilderProps)
    {

        super(scope,name);

        const tableInfo:BucketResult[]=[];


        for(const info of buckets){

            const bucket=createBucket(this,info.name,{
                enableCors:info.enableCors
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


            tableInfo.push({
                info,
                bucket,
            })

        }

        this.buckets=tableInfo;

        accessManager?.addGroup(this);
    }
}
