import { IAwsAuthType } from "@iyio/aws";
import { IAuthProviderType, ScopeRegistration } from "@iyio/common";
import { CognitoAuthProvider } from "./CognitoAuthProvider";

export const cognitoAuthProviderModule=(reg:ScopeRegistration)=>{
    reg.provideForType(IAuthProviderType,scope=>CognitoAuthProvider.fromScope(scope))
        .andFor(IAwsAuthType);
}


