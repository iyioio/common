import { Credentials, Provider } from "@aws-sdk/types";
import { Scope } from "@iyio/common";
export interface IAwsAuth
{
    /**
     * Returns a credentials provider or throws an error.
     */
    getAuthProvider(scope:Scope):Provider<Credentials>|undefined;
}
