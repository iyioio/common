import { HttpMethod, ParamTypeDef } from "@iyio/common";
import * as ag from "aws-cdk-lib/aws-apigateway";
import type * as cf from "aws-cdk-lib/aws-cloudfront";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as db from "aws-cdk-lib/aws-dynamodb";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as secrets from 'aws-cdk-lib/aws-secretsmanager';
import * as sns from "aws-cdk-lib/aws-sns";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";
import type { BridgeEvent } from "./BridgeEvent";
import type { Container } from "./Container";
import { ParamOutput } from "./ParamOutput";
import type { SqlCluster } from "./SqlCluster";
import type { StaticWebSite } from "./StaticWebSite";
import type { UserPoolBuilder } from "./UserPoolBuilder";

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

    fn?:lambda.Function;
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

export const allCommonAccessTypes=['read','write','delete','invoke','list','scan','query','auth'] as const;
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

export interface NamedQueue
{
    name:string;
    queue:sqs.Queue;
}

export interface NamedResource
{
    name:string;
    queue?:sqs.Queue;
    fn?:lambda.Function;
    bucket?:s3.Bucket;
    event?:BridgeEvent;
    container?:Container;
    table?:db.Table;
    sqlCluster?:SqlCluster;
    api?:IApiRouter;
    secret?:secrets.Secret;
    staticWebsite?:StaticWebSite;
    userPoolBuilder?:UserPoolBuilder;
}

export interface IEventTarget
{
    /**
     * Used to match the target in a managed stack
     */
    managedName?:string;
    fn?:lambda.Function;
    task?:targets.EcsTaskProps;
}

export interface ApiRoute
{
    path:string;

    methods?:HttpMethod[];

    queryStrings?:elbv2.QueryStringCondition[];

    sourceIps?:string[];

    auth?:ApiRouteAuth[];

    /**
     * The name of the target of the route. Named targets are used with ManagedStacks and are
     * applied at the end of the stack generation.
     */
    targetName?:string;

    target?:ApiRouteTarget;

    fnTargetOptions?:ag.LambdaIntegrationOptions;
}

export interface ApiRouteAuth
{
    method?:HttpMethod;
    userPool?:IHasUserPool;
    /**
     * A name to match to managed user pools
     */
    managedName?:string;
    roles?:string[]
}

export interface ApiRouteTarget
{
    targetName?:string;
    topic?:sns.Topic;
    fn?:lambda.Function;
    elbTarget?:ApiLoadBalancerTarget;
}

export interface IApiRouter
{
    addApiTarget(route:ApiRoute,target:ApiRouteTarget):void;
    addMatchingTargets(targets:ApiRouteTarget[]):void;
}

export interface IHasUserPool
{
    managedName:string;
    userPool:cognito.UserPool;
    userPoolClient:cognito.IUserPoolClient;
    userPoolDomain:cognito.IUserPoolDomain;
}

export interface ApiLoadBalancerTarget
{
    target:elbv2.IApplicationLoadBalancerTarget;
    port?:number;
    vpc?:ec2.IVpc;
}
