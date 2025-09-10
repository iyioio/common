import { ScopeRegistration, secretManager } from "@iyio/common";
import { AwsSecretManager } from "./AwsSecretManager.js";

export const awsSecretsModule=(scope:ScopeRegistration)=>{
    scope.addProvider(secretManager,scope=>AwsSecretManager.fromScope(scope));
}
