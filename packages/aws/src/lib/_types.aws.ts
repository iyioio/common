import { defineProvider, defineStringParam } from "@iyio/common";
import { AwsAuthProvider } from "./aws-auth";

export const AwsAuthProviders=defineProvider<AwsAuthProvider>("AwsAuthProviders");

export const awsRegionParam=defineStringParam('AWS_REGION');
export const awsProfileParam=defineStringParam('ASW_PROFILE');

export const awsHttpSignerServiceParam=defineStringParam('AWS_HTTP_SIGNER_SERVICE','lambda');
