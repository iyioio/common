import { IHttpRequestSignerType, ScopeRegistration } from "@iyio/common";
import { AwsHttpRequestSigner } from "./AwsHttpRequestSigner";

export const awsModule=(scope:ScopeRegistration)=>{
    scope.provideForType(IHttpRequestSignerType,scope=>AwsHttpRequestSigner.fromScope(scope));
}
