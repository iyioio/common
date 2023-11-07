import { ParamTypeDef } from "@iyio/common";
import type * as cf from "aws-cdk-lib/aws-cloudfront";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import { ParamOutput } from "./ParamOutput";

export interface IParamOutputConsumer
{
    consumeParams(paramOutput:ParamOutput):void;
}

export type ParamType='default'|'fn';

export interface EnvVarTarget
{
    name:string;

    /**
     * Names of params to exclude from the target. This is needed to preview circular resource
     * dependencies.
     */
    excludeParams:(string|ParamTypeDef<string>)[];

    /**
     * Names of params that are required by the target. The primary use of requiredParams are to
     * allow lambdas to receive the names of other lambda functions. By Default lambda functions
     * do not receive the names of other lambdas to prevent circular dependencies.
     */
    requiredParams:(string|ParamTypeDef<string>)[];

    varContainer:IHasEnvVars;
}

export interface IHasEnvVars
{
    addEnvironment(key:string,value:string):void
}

export interface HasParams
{
    readonly params:ParamOutput;
}

export type ScopeWithParams=Construct & HasParams;


export type Grantee = iam.IGrantable & {
    addToRolePolicy?(statement:iam.PolicyStatement):void;
    addToPolicy?(statement:iam.PolicyStatement):void;
}

export const allCommonAccessTypes=['read','write','delete','invoke','list','scan','query'] as const;
export type CommonAccessType=typeof allCommonAccessTypes[number];


export interface IamPolicyDescription
{
    allow:boolean;
    actions:string[];
    resources:string[];
}

export interface AccessGranter
{
    grantName:string;
    grant?:(request:AccessRequest)=>void;
    getPolicy?:(request:AccessRequest)=>iam.PolicyStatement|iam.PolicyStatement[]|null|undefined;
    passiveGrants?:PassiveAccessGrantDescription[];
}

export interface IAccessGrantGroup
{
    accessGrants:AccessGranter[];
}

export interface AccessRequestDescription
{
    grantName:string;
    types?:CommonAccessType[];
    iamPolicy?:IamPolicyDescription;
}

export interface AccessRequest extends AccessRequestDescription
{
    grantee:Grantee;
    varContainer?:EnvVarTarget;
}

export interface PassiveAccessGrantDescription
{
    grantName:string;
    /**
     * If true all fns should be granted access
     */
    allFns?:boolean;

    /**
     * If true all passive targets should be grated access
     */
    all?:boolean;

    targetName?:string;
    types?:CommonAccessType[];
}

export interface PassiveAccessTarget
{
    targetName:string;
    grantee:Grantee;
    varContainer?:EnvVarTarget;
    isFn?:boolean;
}

export interface IPassiveAccessTargetGroup
{
    passiveTargets:PassiveAccessTarget[];
}

export interface IAccessRequestGroup
{
    accessRequests:AccessRequest[];
}

export interface SiteContentSource extends SiteContentSourceDescription
{
    source:cf.SourceConfiguration;
    sourceDomain:string;
    fn?:lambda.IFunction;
}

export interface SiteContentSourceDescription
{
    targetSiteName:string;
    prefix?:string;
    accessSiteOrigin?:boolean;
}

/**
 * Get converted into a SiteContentSource with an S3 source
 */
export interface BucketSiteContentSource
{
    bucket:string|s3.Bucket;
    originPath?:string;
    fallbackBucket?:string|s3.Bucket;
    fallbackOriginPath?:string;
    pattern:string;
}

export interface NamedFn
{
    name:string;
    fn:lambda.Function;
    domain?:string;
    url?:lambda.FunctionUrl;
}

export interface NamedBucket
{
    name:string;
    bucket:s3.Bucket;
    public:boolean;
}
