import { AuthProvider, UserFactoryCallback } from "./auth-types";
import { AuthService } from "./AuthService";
import { BaseUser } from "./BaseUser";
import { HashMap } from "./common-types";
import { HttpFetcher, HttpRequestSigner } from "./http-types";
import { HttpClient } from "./HttpClient";
import { HttpDefaultFetcher } from "./HttpDefaultFetcher";
import { JwtProvider } from "./jwt";
import { RouterStore } from "./RouterStore";
import { defineBoolParam, defineClient, defineFactory, defineNumberParam, defineParam, defineProvider, defineReadonlyObservable, defineService, defineStringParam } from "./scope-lib";
import { ISqlClient } from "./sql-types";
import { IStore, StoreProvider } from "./store-types";
import { stringToHashMap } from "./string-converters";
import { _setUser } from "./_internal.common";


export const apiBaseUrlParam=defineStringParam('apiBaseUrl');

// HTTP
export const httpClient=defineClient<HttpClient>('httpClient',scope=>HttpClient.fromScope(scope));
export const HttpRequestSigners=defineProvider<HttpRequestSigner>('HttpRequestSigners');
export const HttpFetchers=defineProvider<HttpFetcher>('HttpFetchers',()=>new HttpDefaultFetcher());

export const httpBaseUrlMapParam=defineParam<HashMap<string>>('httpBaseUrlMap',stringToHashMap);
export const httpBaseUrlPrefixParam=defineStringParam('httpBaseUrlPrefix');
export const httpLogRequestsParam=defineBoolParam('httpLogRequests');
export const httpLogResponsesParam=defineBoolParam('httpLogResponses');
export const httpMaxRetriesParam=defineNumberParam('httpMaxRetries',5);
export const httpRetryDelayMsParam=defineNumberParam('httpRetryDelayMs',500);


// JWP
export const JwtProviders=defineProvider<JwtProvider>('JwtProviders');



// SQL
export const sqlClient=defineClient<ISqlClient>('sqlClient');


// Store
export const storeRoot=defineService<RouterStore>("storeRoot",scope=>new RouterStore(scope));
export const StoreProviders=defineProvider<StoreProvider|IStore>("StoreProviders");


// Auth
export const authService=defineService<AuthService>('auth',scope=>AuthService.fromScope(scope));
export const currentBaseUser=defineReadonlyObservable<BaseUser|null>('currentBaseUser',_setUser,()=>null);
export const AuthProviders=defineProvider<AuthProvider>("AuthProviders");
export const UserFactory=defineFactory<UserFactoryCallback>('UserFactory',options=>new BaseUser(options));
