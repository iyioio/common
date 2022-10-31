import { IOpInit } from "@iyio/common";
import { User } from "./User";

export type SignInResult={
    success:true;
    user:User;
} | {
    success:false;
    errorMessage:string;
    error?:any;
}

export interface UserAuthProviderData
{
    /**
     * Provider type
     */
    type:string;

    /**
     * User Id
     */
    id:string;

    /**
     * Auth provider specific data
     */
    providerData:any;
}


export interface IAuthProvider extends IOpInit
{
    type:string;

    getUserAsync(data:UserAuthProviderData):Promise<User|null>;

    signOutAsync(user:User):Promise<void>;

    signInWithEmailPasswordAsync?(email:string,password:string):Promise<SignInResult|undefined>;
}
