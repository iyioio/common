import { IAuthProviderType } from "@iyio/app-common";
import { IAwsAuthType } from "@iyio/aws";
import { ScopeRegistration } from "@iyio/common";
import { CognitoAuthProvider } from "./CognitoAuthProvider";

export const cognitoAuthProviderModule=(reg:ScopeRegistration)=>{
    reg.provideForType(IAuthProviderType,scope=>CognitoAuthProvider.fromScope(scope))
        .andFor(IAwsAuthType);
}


