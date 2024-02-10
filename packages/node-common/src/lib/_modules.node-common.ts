import { CryptoMethodsProvider, HttpFetchers, ScopeRegistration } from "@iyio/common";
import { HttpNodeFetcher } from "./HttpNodeFetcher";
import { SyncConfigParams } from "./SyncConfigParams";

export const nodeCommonModule=(reg:ScopeRegistration)=>{
    reg.addParams(new SyncConfigParams().populateEnv(true));
    reg.addProvider(HttpFetchers,()=>new HttpNodeFetcher());
    reg.addProvider(CryptoMethodsProvider,()=>require('node:crypto'));
}
