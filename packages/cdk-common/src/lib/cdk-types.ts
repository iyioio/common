import { ParamTypeDef } from "@iyio/common";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { ParamOutput } from "./ParamOutput";

export interface IParamOutputConsumer
{
    consumeParams(paramOutput:ParamOutput):void;
}

export type ParamType='default'|'fn';

export interface EnvVarTarget
{
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

export const allCommonAccessTypes=['read','write','delete','invoke','list'] as const;
export type CommonAccessType=typeof allCommonAccessTypes[number];

export interface AccessGranter
{
    grantName:string;
    grant?:(request:AccessRequest)=>void;
    getPolicy?:(request:AccessRequest)=>iam.PolicyStatement|iam.PolicyStatement[]|null|undefined;
}

export interface IAccessGrantGroup
{
    accessGrants:AccessGranter[];
}

export interface AccessRequestDescription
{
    grantName:string;
    types?:CommonAccessType[];
}

export interface AccessRequest extends AccessRequestDescription
{
    grantee:Grantee;
}


export interface IAccessRequestGroup
{
    accessRequests:AccessRequest[];
}
