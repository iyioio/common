import { AwsAuthProviders } from "@iyio/aws";
import { IAuthProviders, ScopeRegistration } from "@iyio/common";
import { CognitoAuthProvider } from "./CognitoAuthProvider";

export const cognitoAuthProviderModule=(reg:ScopeRegistration)=>{
    reg.provideForType(IAuthProviders,scope=>CognitoAuthProvider.fromScope(scope))
        .andFor(AwsAuthProviders);
}


