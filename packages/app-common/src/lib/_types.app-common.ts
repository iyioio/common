import { defineReadonlyObservable, defineService, defineType } from "@iyio/common";
import { IAuthProvider } from "./auth-types";
import { AuthService } from "./AuthService";
import { User } from "./User";
import { _setUser } from "./_internal.app-common";

export const authService=defineService<AuthService>('auth',scope=>AuthService.fromScope(scope));

export const currentUser=defineReadonlyObservable<User|null>('UserType',_setUser,()=>null);

export const IAuthProviderType=defineType<IAuthProvider>("IAuthProviderType");
