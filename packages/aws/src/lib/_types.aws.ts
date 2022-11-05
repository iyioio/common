import { defineStringParam, defineType } from "@iyio/common";
import { IAwsAuth } from "./aws-auth";

export const IAwsAuthType=defineType<IAwsAuth>("IAwsAuthType");

export const awsRegionParam=defineStringParam('AWS_REGION');
export const awsProfileParam=defineStringParam('ASW_PROFILE');

export const awsHttpSignerServiceParam=defineStringParam('AWS_HTTP_SIGNER_SERVICE','lambda');
