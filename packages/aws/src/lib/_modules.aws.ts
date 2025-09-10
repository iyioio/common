import { HttpRequestSigners, ScopeRegistration } from "@iyio/common";
import { AwsHttpRequestSigner } from "./AwsHttpRequestSigner.js";

export const awsModule=(scope:ScopeRegistration)=>{
    scope.addProvider(HttpRequestSigners,scope=>AwsHttpRequestSigner.fromScope(scope));
}
