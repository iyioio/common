import { AwsAuthProviders } from "@iyio/aws";
import { AuthProviders, JwtValidators, ScopeRegistration } from "@iyio/common";
import { CognitoAuthProvider, CognitoAuthProviderType } from "./CognitoAuthProvider.js";
import { CognitoJwtValidator, CognitoJwtValidatorType } from "./CognitoJwtValidator.js";

export const cognitoAuthProviderModule=(reg:ScopeRegistration)=>{
    reg.addProvider(AuthProviders,scope=>CognitoAuthProvider.fromScope(scope),CognitoAuthProviderType)
        .and(AwsAuthProviders);
}

export const cognitoBackendAuthProviderModule=(reg:ScopeRegistration)=>{
    reg.addProvider(JwtValidators,scope=>CognitoJwtValidator.fromScope(scope),CognitoJwtValidatorType)
}

