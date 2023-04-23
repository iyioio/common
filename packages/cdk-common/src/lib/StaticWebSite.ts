import { HashMap } from "@iyio/common";
import { pathExistsSync } from "@iyio/node-common";
import * as cdk from "aws-cdk-lib";
import * as cm from "aws-cdk-lib/aws-certificatemanager";
import * as cf from "aws-cdk-lib/aws-cloudfront";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3Deployment from 'aws-cdk-lib/aws-s3-deployment';
import { Construct, IConstruct, Node } from "constructs";
import { ParamOutput } from "./ParamOutput";
import { cdkOutputCache, cdkUseCachedOutputs } from "./cdk-lib";
import { getRegexRedirectMapAsString } from "./getRedirectMap";

export const getStackItemName=(stack:IConstruct,name:string,maxLength=64)=>{
    const n=`${name}-${Node.of(stack).addr}`;
    return n.length>maxLength?n.substring(0,maxLength):n;
}

export interface StaticWebSiteProps
{
    nxExportedPackage?:string;
    path?:string;
    cdn?:boolean;
    domainName?:string;
    envVars?:HashMap<string>;
    fallbackBucket?:s3.Bucket;
    createOutputs?:boolean;
}

export class StaticWebSite extends Construct {

    public readonly bucketUrl:string;
    public readonly bucketIndexUrl:string;
    public readonly distributionUrl:string|null;
    public readonly domainUrl:string|null;
    public readonly url:string;

    public readonly bucketDeployment:s3Deployment.BucketDeployment;

    constructor(scope: Construct, name: string, {
        path,
        nxExportedPackage,
        cdn=false,
        domainName,
        envVars,
        fallbackBucket,
        createOutputs,
    }:StaticWebSiteProps){

        super(scope, name);

        let dir:string;
        if(path){
            dir=path;
        }else if(nxExportedPackage){
            const packageDir=nxExportedPackage.replace(/\/\\/g,'')
            const cachedDir=`../../${cdkOutputCache}/dist/packages/${packageDir}/exported`;
            const useCache=cdkUseCachedOutputs && pathExistsSync(cachedDir);

            dir=useCache?
                cachedDir:
                `../../dist/packages/${packageDir}/exported`;

            if(useCache){
                console.info(`Using cached output for static website. name:${name}, outputPath:${dir}`);
            }
        }else{
            throw new Error('StaticWebSite requires path or nxExportedPackage')
        }

        let dist:cf.CloudFrontWebDistribution|undefined;


        const bucket=new s3.Bucket(this,'SiteBucket',{
            websiteIndexDocument:"index.html",
            websiteErrorDocument:fallbackBucket?undefined:"index.html",
            publicReadAccess: true,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
        });

        this.bucketUrl=`https://${bucket.bucketDomainName}`;
        this.bucketIndexUrl=this.bucketUrl+'/index.html';

        this.domainUrl=null;


        if(cdn){

            let certificate:cm.Certificate|undefined=undefined;
            if(domainName){
                certificate = new cm.Certificate(this, `Cert`, {
                    domainName:domainName,
                    validation:cm.CertificateValidation.fromDns()
                });
                this.domainUrl=`https://${domainName}`
            }

            const originIdent=new cf.OriginAccessIdentity(this,`OriginIdent`);

            const addBucketResourcePolicy=(bucket:s3.Bucket)=>{
                bucket.addToResourcePolicy(
                    new iam.PolicyStatement({
                        actions: ["s3:GetObject"],
                        resources: [bucket.arnForObjects("*")],
                        principals: [
                            new iam.CanonicalUserPrincipal(
                                originIdent.cloudFrontOriginAccessIdentityS3CanonicalUserId
                            ),
                        ],
                    })
                );
            }
            addBucketResourcePolicy(bucket);
            if(fallbackBucket){
                addBucketResourcePolicy(fallbackBucket);
            }

            const redirectMap = getRegexRedirectMapAsString(dir);
            const redirectFunc = new cf.Function(
                this,
                'RedirectFn',
                {
                    // setting functionName is a workaround for a cdk bug that causes function names
                    // to get mixed up - https://github.com/aws/aws-cdk/issues/15765
                    functionName:getStackItemName(this,'RedirectFn'),

                    code:cf.FunctionCode.fromInline(`
                        var map=${redirectMap};
                        function handler(event) {
                            var request=event.request;
                            var uri=request.uri;
                            if(uri.endsWith('/')){
                                uri=uri.substring(0,uri.length-1);
                            }
                            for(var i=0;i<map.length;i++){
                                var r=map[i];
                                if(r.match.test(uri)){
                                    request.uri=r.path;
                                    break;
                                }
                            }
                            return request;
                        }
                    `),
                }
            );

            dist=new cf.CloudFrontWebDistribution(this,'Dist',{
                defaultRootObject:'index.html',
                viewerCertificate:certificate?{
                    aliases:domainName?[domainName]:[],
                    props:{
                        acmCertificateArn:certificate.certificateArn,
                        sslSupportMethod:'sni-only'
                    }

                }:undefined,
                originConfigs:[
                    {
                        s3OriginSource:{
                            s3BucketSource:bucket,
                            originAccessIdentity:originIdent,
                        },
                        failoverS3OriginSource:fallbackBucket?{
                            s3BucketSource:fallbackBucket,
                            originAccessIdentity:originIdent,
                        }:undefined,
                        failoverCriteriaStatusCodes:fallbackBucket?[404,403]:undefined,
                        behaviors:[{
                            isDefaultBehavior:true,
                            viewerProtocolPolicy:cf.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                            compress:true,
                            allowedMethods:cf.CloudFrontAllowedMethods.GET_HEAD_OPTIONS,
                            functionAssociations:[{
                                function:redirectFunc,
                                eventType:cf.FunctionEventType.VIEWER_REQUEST,
                            }],
                        }],
                    },
                ],
                errorConfigurations:[
                    {
                        errorCode:403,
                        responsePagePath:"/index.html",
                        responseCode:403,
                    },
                    {
                        errorCode:404,
                        responsePagePath:"/404.html",
                        responseCode:404,
                    },
                ],

            });

            this.distributionUrl=`https://${dist.distributionDomainName}`;

        }else{
            this.distributionUrl=null;
        }


        const sources:s3Deployment.ISource[]=[
            s3Deployment.Source.asset(dir)
        ]

        if(envVars && Object.keys(envVars).length){
            sources.push(s3Deployment.Source.jsonData("__DOT_ENV__.json",envVars));
            this.dotEnvSet=true;
        }

        this.bucketDeployment=new s3Deployment.BucketDeployment(this,'BucketDeployment',{
            destinationBucket:bucket,
            sources,

            // handles cache invalidation
            distributionPaths:dist?["/*"]:undefined,
            distribution:dist,
        });

        this.url=this.domainUrl??this.distributionUrl??this.bucketUrl;



        if(createOutputs){
            new cdk.CfnOutput(this,name+'BucketUrl',{value:this.bucketUrl});
            if(this.distributionUrl){
                new cdk.CfnOutput(this,name+'DistributionUrl',{value:this.distributionUrl});
            }
            if(this.domainUrl){
                new cdk.CfnOutput(this,name+'DomainUrl',{value:this.domainUrl});
            }
        }

    }

    private dotEnvSet=false;

    public consumeParams(paramOutput:ParamOutput):void
    {
        if(this.dotEnvSet){
            return;
        }
        this.dotEnvSet=true;
        this.bucketDeployment.addSource(s3Deployment.Source.jsonData("__DOT_ENV__.json",paramOutput.params));
    }
}
