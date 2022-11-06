import { BaseUser } from "./BaseUser";
import { IOpDisposable, IOpInit, SymStrHashMap } from "./common-types";

export type AuthSignInResult={
    success:true;
    user:BaseUser;
} | {
    success:false;
    message:string;
    error?:any;
}

export type AuthRegisterResult={
    status:'success',
    user:BaseUser;
} | {
    status:'verificationRequired',
    message:string;
    /**
     * A email or phone number the verification was sent to.
     */
    verificationDestination:string;
} | {
    status:'error',
    message:string;
    error?:any;
}

export type AuthRegisterStatus=AuthRegisterResult["status"];


export type AuthDeleteResult={
    status:'success'
} | {
    status:'pending'
    message:string;
} | {
    status:'error'
    message:string;
    error?:any;
}

export type AuthDeleteStatus=AuthDeleteResult["status"];

export interface UserAuthProviderData
{
    /**
     * Provider type
     */
    readonly type:string;

    /**
     * User Id
     */
    readonly userId:string;

    /**
     * Auth provider specific data
     */
    readonly providerData?:SymStrHashMap;
}


export interface IAuthProvider extends IOpInit, IOpDisposable
{
    /**
     * A string use to distinguish auth provider types.
     */
    type:string;

    /**
     * Attempts to get or create a user using the given auth provider data.
     */
    getCurrentUser?():Promise<BaseUser|null>;

    /**
     * Attempts to get or create a user using the given auth provider data.
     */
    getUserAsync(data:UserAuthProviderData):Promise<BaseUser|null>;

    /**
     * Deletes the user
     */
    deleteAsync(user:BaseUser):Promise<AuthDeleteResult|undefined>;

    /**
     * Signs out the given user
     */
    signOutAsync(user:BaseUser):Promise<void>;

    /**
     * Signs in  a user using their email and password. Undefined can be returned to indicate the
     * provider does not support signing in using with the given email.
     */
    signInEmailPasswordAsync?(email:string,password:string):Promise<AuthSignInResult|undefined>;

    /**
     * Register a user using their email and password. Undefined can be returned to indicate the
     * provider does not support registering using with the given email.
     */
    registerEmailPasswordAsync?(email:string,password:string):Promise<AuthRegisterResult|undefined>;

}
