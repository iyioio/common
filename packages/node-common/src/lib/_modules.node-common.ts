import { CryptoMethodsProvider, HttpFetchers, ScopeRegistration } from "@iyio/common";
import { HttpNodeFetcher } from "./HttpNodeFetcher.js";
import { SyncConfigParams } from "./SyncConfigParams.js";

export const nodeCommonModule=(reg:ScopeRegistration)=>{
    reg.addParams(new SyncConfigParams().populateEnv(true));
    reg.addProvider(HttpFetchers,()=>new HttpNodeFetcher());
    reg.addProvider(CryptoMethodsProvider,()=>require('node:crypto'));
}
