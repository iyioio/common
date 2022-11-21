import { AuthProvider, UserFactoryCallback } from "./auth-types";
import { AuthService } from "./AuthService";
import { BaseUser } from "./BaseUser";
import { BrowserUiRouter } from "./BrowserUiRouter";
import { HashMap } from "./common-types";
import { HttpFetcher, HttpRequestSigner } from "./http-types";
import { HttpClient } from "./HttpClient";
import { HttpDefaultFetcher } from "./HttpDefaultFetcher";
import { JwtProvider } from "./jwt";
import { defaultQueryRecordStorePath, QueryCtrl } from "./QueryCtrl";
import { RouterStore } from "./RouterStore";
import { defineBoolParam, defineClient, defineFactory, defineNumberParam, defineParam, defineProvider, defineReadonlyObservable, defineService, defineServiceFactory, defineStringParam } from "./scope-lib";
import { ISqlClient } from "./sql-types";
import { IStore, StoreProvider } from "./store-types";
import { stringToHashMap } from "./string-converters";
import { IUiRouter } from "./ui-lib";
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


// QueryCtrl
export const queryCtrlFactory=defineServiceFactory<QueryCtrl>('queryCtrlFactory',scope=>QueryCtrl.fromScope(scope));
export const queryRecordStorePathParam=defineStringParam('queryRecordStorePath',defaultQueryRecordStorePath);


// Store
export const storeRoot=defineService<RouterStore>("storeRoot",scope=>new RouterStore(scope));
export const StoreProviders=defineProvider<StoreProvider|IStore>("StoreProviders");


// Auth
export const authService=defineService<AuthService>('auth',scope=>AuthService.fromScope(scope));
export const currentBaseUser=defineReadonlyObservable<BaseUser|null>('currentBaseUser',_setUser,()=>null);
export const AuthProviders=defineProvider<AuthProvider>("AuthProviders");
export const UserFactory=defineFactory<UserFactoryCallback>('UserFactory',options=>new BaseUser(options));


// UI Routing
export const uiRouterService=defineService<IUiRouter>(
    'uiRouterService',BrowserUiRouter.isSupported()?()=>new BrowserUiRouter():undefined);
