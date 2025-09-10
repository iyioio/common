import { AuthProvider, UserFactoryCallback } from "./auth-types.js";
import { AuthService } from "./AuthService.js";
import { BaseUser } from "./BaseUser.js";
import { defineFactory, defineProvider, defineReadonlyObservable, defineService } from "./scope-lib.js";
import { _setUser } from "./_internal.common.js";

export const authService=defineService<AuthService>('auth',scope=>AuthService.fromScope(scope));
export const currentBaseUser=defineReadonlyObservable<BaseUser|null>('currentBaseUser',_setUser,()=>null);
export const AuthProviders=defineProvider<AuthProvider>("AuthProviders");
export const UserFactory=defineFactory<UserFactoryCallback>('UserFactory',options=>new BaseUser(options));
