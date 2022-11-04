import { defineString, defineType } from "@iyio/common";
import { IAwsAuth } from "./aws-auth";

export const IAwsAuthType=defineType<IAwsAuth>("IAwsAuthType");

export const awsRegionParam=defineString('AWS_REGION');
export const awsProfileParam=defineString('ASW_PROFILE');
