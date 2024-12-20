import { defineProvider, defineStringParam } from "@iyio/common";
import { AwsAuthProvider } from "./aws-auth";

export const AwsAuthProviders=defineProvider<AwsAuthProvider>("AwsAuthProviders");

export const awsRegionParam=defineStringParam('awsRegion');
export const awsProfileParam=defineStringParam('aswProfile');

export const awsHttpSignerServiceParam=defineStringParam('awsHttpSignerService','lambda');

export const awsManagedEvtLambdaInvokeRoleArnParam=defineStringParam('awsManagedEvtLambdaInvokeRoleArnParam');
