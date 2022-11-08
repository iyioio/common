import { AwsAuthProviders } from "@iyio/aws";
import { AuthProviders, ScopeRegistration } from "@iyio/common";
import { CognitoAuthProvider } from "./CognitoAuthProvider";

export const cognitoAuthProviderModule=(reg:ScopeRegistration)=>{
    reg.addProvider(AuthProviders,scope=>CognitoAuthProvider.fromScope(scope))
        .and(AwsAuthProviders);
}


