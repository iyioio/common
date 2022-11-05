import { HashMap } from "./common-types";
import { HttpFetcher, HttpRequestSigner } from "./http-types";
import { HttpClient } from "./HttpClient";
import { HttpDefaultFetcher } from "./HttpDefaultFetcher";
import { JwtProvider } from "./jwt";
import { defineBoolParam, defineNumberParam, defineParam, defineService, defineStringParam, defineType } from "./scope-lib";
import { stringToHashMap } from "./string-converters";


export const apiBaseUrlParam=defineStringParam('API_BASE_URL');

// HTTP

export const http=defineService<HttpClient>('http',scope=>HttpClient.fromScope(scope));
export const HttpRequestSignerType=defineType<HttpRequestSigner>('HttpRequestSigner');
export const HttpFetcherType=defineType<HttpFetcher>('HttpFetcher',()=>new HttpDefaultFetcher());

export const httpBaseUrlMapParam=defineParam<HashMap<string>>('HTTP_BASE_URL_MAP',stringToHashMap);
export const httpBaseUrlPrefixParam=defineStringParam('HTTP_BASE_URL_PREFIX');
export const httpLogRequestsParam=defineBoolParam('HTTP_LOG_REQUESTS');
export const httpLogResponsesParam=defineBoolParam('HTTP_LOG_RESPONSES');
export const httpMaxRetriesParam=defineNumberParam('HTTP_MAX_RETRIES',5);
export const httpRetryDelayMsParam=defineNumberParam('HTTP_RETRY_DELAY_MS',500);


// JWP

export const JwtProviderType=defineType<JwtProvider>('JwtProvider');
