import { IAuthProviderType } from "@iyio/app-common";
import { IAwsAuthType } from "@iyio/aws";
import { Scope } from "@iyio/common";
import { CognitoAuthProvider } from "./CognitoAuthProvider";

export const bootCognitoAuthProvider=(scope:Scope)=>{
    scope
        .provideForType(IAuthProviderType,scope=>CognitoAuthProvider.fromScope(scope))
        .andFor(IAwsAuthType);
}


