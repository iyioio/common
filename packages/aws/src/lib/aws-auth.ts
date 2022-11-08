import { Credentials, Provider } from "@aws-sdk/types";
export interface AwsAuthProvider
{
    /**
     * Returns a credentials provider or throws an error.
     */
    getAuthProvider():Provider<Credentials>|undefined;
}
