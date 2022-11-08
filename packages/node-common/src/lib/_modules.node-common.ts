import { HttpFetchers, ScopeRegistration } from "@iyio/common";
import { HttpNodeFetcher } from "./HttpNodeFetcher";

export const nodeCommonModule=(reg:ScopeRegistration)=>{
    reg.addProvider(HttpFetchers,()=>new HttpNodeFetcher())
}
