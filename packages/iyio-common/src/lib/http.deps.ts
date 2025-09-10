import { HashMap } from "./common-types.js";
import { defaultHttpClientMaxRetries } from "./http-lib.js";
import { HttpFetcher, HttpRequestSigner } from "./http-types.js";
import { HttpClient } from "./HttpClient.js";
import { HttpDefaultFetcher } from "./HttpDefaultFetcher.js";
import { defineBoolParam, defineClient, defineNumberParam, defineParam, defineProvider, defineStringParam } from "./scope-lib.js";
import { stringToHashMap } from "./string-converters.js";

export const apiBaseUrlParam=defineStringParam('apiBaseUrl');

export const httpClient=defineClient<HttpClient>('httpClient',scope=>HttpClient.fromScope(scope));
export const HttpRequestSigners=defineProvider<HttpRequestSigner>('HttpRequestSigners');
export const HttpFetchers=defineProvider<HttpFetcher>('HttpFetchers',()=>new HttpDefaultFetcher());

export const httpBaseUrlMapParam=defineParam<HashMap<string>>('httpBaseUrlMap',stringToHashMap);
export const httpBaseUrlPrefixParam=defineStringParam('httpBaseUrlPrefix');
export const httpLogRequestsParam=defineBoolParam('httpLogRequests');
export const httpLogResponsesParam=defineBoolParam('httpLogResponses');
export const httpMaxRetriesParam=defineNumberParam('httpMaxRetries',defaultHttpClientMaxRetries);
export const httpRetryDelayMsParam=defineNumberParam('httpRetryDelayMs',500);
