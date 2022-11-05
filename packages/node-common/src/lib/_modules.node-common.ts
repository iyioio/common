import { IHttpFetcherType, ScopeRegistration } from "@iyio/common";
import { HttpNodeFetcher } from "./HttpNodeFetcher";

export const nodeCommonModule=(reg:ScopeRegistration)=>{
    reg.provideForType(IHttpFetcherType,()=>new HttpNodeFetcher())
}
