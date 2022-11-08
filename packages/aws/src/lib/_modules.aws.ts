import { HttpRequestSigners, ScopeRegistration } from "@iyio/common";
import { AwsHttpRequestSigner } from "./AwsHttpRequestSigner";

export const awsModule=(scope:ScopeRegistration)=>{
    scope.provideForType(HttpRequestSigners,scope=>AwsHttpRequestSigner.fromScope(scope));
}
