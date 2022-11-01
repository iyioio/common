import { Credentials, Provider } from "@aws-sdk/types";
import { DependencyContainer } from "@iyio/common";
export interface IAwsAuth
{
    /**
     * Returns a credentials provider or throws an error.
     */
    getAuthProvider(deps:DependencyContainer|undefined):Provider<Credentials>|undefined;
}
