import { IAuthProvider } from "./auth-types";
import { AuthService } from "./AuthService";
import { BaseUser } from "./BaseUser";
import { HashMap } from "./common-types";
import { HttpFetcher, IHttpRequestSigner } from "./http-types";
import { HttpClient } from "./HttpClient";
import { HttpDefaultFetcher } from "./HttpDefaultFetcher";
import { JwtProvider } from "./jwt";
import { RouterStore } from "./RouterStore";
import { defineBoolParam, defineNumberParam, defineParam, defineReadonlyObservable, defineService, defineStringParam, defineType } from "./scope-lib";
import { ISqlClient } from "./sql-types";
import { IStore, StoreProvider } from "./store-types";
import { stringToHashMap } from "./string-converters";
import { _setUser } from "./_internal.common";


export const apiBaseUrlParam=defineStringParam('API_BASE_URL');

// HTTP
export const http=defineService<HttpClient>('http',scope=>HttpClient.fromScope(scope));
export const IHttpRequestSignerType=defineType<IHttpRequestSigner>('IHttpRequestSignerType');
export const IHttpFetcherType=defineType<HttpFetcher>('IHttpFetcherType',()=>new HttpDefaultFetcher());

export const httpBaseUrlMapParam=defineParam<HashMap<string>>('HTTP_BASE_URL_MAP',stringToHashMap);
export const httpBaseUrlPrefixParam=defineStringParam('HTTP_BASE_URL_PREFIX');
export const httpLogRequestsParam=defineBoolParam('HTTP_LOG_REQUESTS');
export const httpLogResponsesParam=defineBoolParam('HTTP_LOG_RESPONSES');
export const httpMaxRetriesParam=defineNumberParam('HTTP_MAX_RETRIES',5);
export const httpRetryDelayMsParam=defineNumberParam('HTTP_RETRY_DELAY_MS',500);


// JWP
export const JwtProviderType=defineType<JwtProvider>('JwtProvider');



// SQL
export const sqlService=defineService<ISqlClient>('sqlService');


// Store
export const storeService=defineService<RouterStore>("storeService",scope=>new RouterStore(scope));
export const IStoreType=defineType<IStore|StoreProvider>("IStoreType");


// Auth
export const authService=defineService<AuthService>('auth',scope=>AuthService.fromScope(scope));
export const currentUser=defineReadonlyObservable<BaseUser|null>('currentUser',_setUser,()=>null);
export const IAuthProviderType=defineType<IAuthProvider>("IAuthProviderType");
