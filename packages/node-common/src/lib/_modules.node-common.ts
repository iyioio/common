import { HttpFetcherType, ScopeRegistration } from "@iyio/common";
import { HttpNodeFetcher } from "./HttpNodeFetcher";

export const nodeCommonModule=(reg:ScopeRegistration)=>{
    reg.provideForType(HttpFetcherType,()=>new HttpNodeFetcher())
}
