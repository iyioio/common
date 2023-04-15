import { AuthProvider, UserFactoryCallback } from "./auth-types";
import { AuthService } from "./AuthService";
import { BaseUser } from "./BaseUser";
import { defineFactory, defineProvider, defineReadonlyObservable, defineService } from "./scope-lib";
import { _setUser } from "./_internal.common";

export const authService=defineService<AuthService>('auth',scope=>AuthService.fromScope(scope));
export const currentBaseUser=defineReadonlyObservable<BaseUser|null>('currentBaseUser',_setUser,()=>null);
export const AuthProviders=defineProvider<AuthProvider>("AuthProviders");
export const UserFactory=defineFactory<UserFactoryCallback>('UserFactory',options=>new BaseUser(options));
