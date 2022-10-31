import { DependencyContainer, HashMap, IDisposable, IInit } from "@iyio/common";
import { store } from "@iyio/key-value-store";
import { IAuthProvider, SignInResult, UserAuthProviderData } from "./auth-types";
import { User } from "./User";
import { setUsr } from "./_internal.app-common";
import { IAuthProviderRef } from "./_ref.app-common";
import { usr } from "./_service.app-common";

const providerDataKey='app-common/Auth/UserAuthProviderData';

export class Auth implements IDisposable, IInit
{

    private _isDisposed=false;
    public get isDisposed(){return this._isDisposed}

    private readonly deps:DependencyContainer;

    private readonly providers:HashMap<Promise<IAuthProvider>>={};

    private getUser(){return usr(this.deps)}

    public constructor(deps:DependencyContainer)
    {
        this.deps=deps;
    }


    public async init():Promise<void>
    {
        const userData=await store(this.deps).getAsync<UserAuthProviderData>(providerDataKey);

        if(userData){
            const provider=await this.getProviderAsync(userData.type);
            const user=await provider?.getUserAsync(userData);
            if(user){
                await this.setUserAsync(user,false);
            }
        }
    }

    private async getProviderAsync(type:string):Promise<IAuthProvider|undefined>
    {
        let p=this.providers[type];
        if(!p){
            if(this._isDisposed){
                return undefined;
            }
            const provider=this.deps.getAll(IAuthProviderRef,type)[0];
            if(!provider){
                return undefined;
            }
            p=(async ()=>{
                await provider.init?.();
                return p;
            })()
            this.providers[type]=p;
        }
        return await p;
    }

    public async signInWithEmailPasswordAsync(email:string,password:string):Promise<SignInResult>
    {
        return await this.handlerSignInResultAsync(
            await this.deps.getForEachAsync(IAuthProviderRef,null,async provider=>{
                return await provider.signInWithEmailPasswordAsync?.(email,password);
            })
        );
    }

    public async signOutAsync():Promise<void>
    {
        const user=this.getUser();
        if(!user){
            return;
        }

        const provider=await this.getProviderAsync(user.providerData.type);
        await provider?.signOutAsync(user);
        await this.setUserAsync(null,true);
    }

    private async handlerSignInResultAsync(result:SignInResult|undefined):Promise<SignInResult>
    {
        if(!result){
            return {
                success:false,
                errorMessage:'No auth provider found'
            }
        }

        if(result.success){
            await this.setUserAsync(result.user,true);
        }

        return result;
    }

    private async setUserAsync(user:User|null,save:boolean)
    {
        if(save){
            if(user){
                await store(this.deps).putAsync<UserAuthProviderData>(providerDataKey,user.providerData);
            }else{
                await store(this.deps).deleteAsync(providerDataKey);
            }
        }
        setUsr(this.deps,user);
    }

    public dispose()
    {
        if(this._isDisposed){
            return;
        }
        this._isDisposed=true;
    }
}
