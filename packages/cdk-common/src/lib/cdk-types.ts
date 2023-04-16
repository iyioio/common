import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { ParamOutput } from "./ParamOutput";

export interface HasParams
{
    readonly params:ParamOutput;
}

export type ScopeWithParams=Construct & HasParams;


export type Grantee = iam.IGrantable & {
    addToRolePolicy?(statement:iam.PolicyStatement):void;
    addToPolicy?(statement:iam.PolicyStatement):void;
}

export type CommonAccessType='read'|'write'|'invoke';

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
