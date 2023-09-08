import { ScopeRegistration, secretManager } from "@iyio/common";
import { AwsSecretManager } from "./AwsSecretManager";

export const awsSecretsModule=(scope:ScopeRegistration)=>{
    scope.addProvider(secretManager,scope=>AwsSecretManager.fromScope(scope));
}
