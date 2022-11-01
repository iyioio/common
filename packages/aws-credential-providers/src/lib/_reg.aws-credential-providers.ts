import { IAuthProviderRef } from "@iyio/app-common";
import { IAwsAuthRef } from "@iyio/aws";
import { DependencyContainer } from "@iyio/common";
import { CognitoAuthProvider } from "./CognitoAuthProvider";

export const registerCognitoAuthProvider=(deps:DependencyContainer)=>{
    const provider=new CognitoAuthProvider(deps);
    deps.registerValue(IAuthProviderRef,provider);
    deps.registerValue(IAwsAuthRef,provider);
}
