import { defineClient } from "@iyio/common";
import { LambdaClient } from "./LambdaClient";

export const lambdaClient=defineClient<LambdaClient>('lambdaClient',scope=>LambdaClient.fromScope(scope))
