import { AuthProvider } from "./auth-types";
import { AuthService } from "./AuthService";
import { BaseUser } from "./BaseUser";
import { HashMap } from "./common-types";
import { HttpFetcher, HttpRequestSigner } from "./http-types";
import { HttpClient } from "./HttpClient";
import { HttpDefaultFetcher } from "./HttpDefaultFetcher";
import { JwtProvider } from "./jwt";
import { RouterStore } from "./RouterStore";
import { defineBoolParam, defineClient, defineNumberParam, defineParam, defineProvider, defineReadonlyObservable, defineService, defineStringParam } from "./scope-lib";
import { ISqlClient } from "./sql-types";
import { IStore, StoreProvider } from "./store-types";
import { stringToHashMap } from "./string-converters";
import { _setUser } from "./_internal.common";


export const apiBaseUrlParam=defineStringParam('API_BASE_URL');

// HTTP
export const httpClient=defineClient<HttpClient>('httpClient',scope=>HttpClient.fromScope(scope));
export const HttpRequestSigners=defineProvider<HttpRequestSigner>('HttpRequestSigners');
export const HttpFetchers=defineProvider<HttpFetcher>('HttpFetchers',()=>new HttpDefaultFetcher());

export const httpBaseUrlMapParam=defineParam<HashMap<string>>('HTTP_BASE_URL_MAP',stringToHashMap);
export const httpBaseUrlPrefixParam=defineStringParam('HTTP_BASE_URL_PREFIX');
export const httpLogRequestsParam=defineBoolParam('HTTP_LOG_REQUESTS');
export const httpLogResponsesParam=defineBoolParam('HTTP_LOG_RESPONSES');
export const httpMaxRetriesParam=defineNumberParam('HTTP_MAX_RETRIES',5);
export const httpRetryDelayMsParam=defineNumberParam('HTTP_RETRY_DELAY_MS',500);


// JWP
export const JwtProviders=defineProvider<JwtProvider>('JwtProviders');



// SQL
export const sqlClient=defineClient<ISqlClient>('sqlClient');


// Store
export const storeRoot=defineService<RouterStore>("storeRoot",scope=>new RouterStore(scope));
export const StoreProviders=defineProvider<StoreProvider|IStore>("StoreProviders");


// Auth
export const authService=defineService<AuthService>('auth',scope=>AuthService.fromScope(scope));
export const currentUser=defineReadonlyObservable<BaseUser|null>('currentUser',_setUser,()=>null);
export const AuthProviders=defineProvider<AuthProvider>("AuthProviders");
