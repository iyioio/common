import { breakFunction, continueFunction, DependencyContainer, DisposeContainer, HashMap, IDisposable, IInit, isValidEmail } from "@iyio/common";
import { store } from "@iyio/key-value-store";
import { AuthDeleteResult, AuthRegisterResult, AuthSignInResult, IAuthProvider, UserAuthProviderData } from "./auth-types";
import { User } from "./User";
import { setUsr } from "./_internal.app-common";
import { IAuthProviderRef } from "./_ref.app-common";
import { usr } from "./_service.app-common";

const providerDataKey='app-common/Auth/UserAuthProviderData';

export class Auth implements IDisposable, IInit
{

    private _isDisposed=false;
    public get isDisposed(){return this._isDisposed}
    protected readonly disposables:DisposeContainer=new DisposeContainer();

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
        }else{
            await this.deps.forEachAsync(IAuthProviderRef,null,async p=>{
                const user=await p.getCurrentUser?.();
                if(user){
                    await this.setUserAsync(user,false);
                    return breakFunction;
                }else{
                    return continueFunction;
                }
            })
        }
    }

    public dispose()
    {
        if(this._isDisposed){
            return;
        }
        this._isDisposed=true;
        this.disposables.dispose();
    }

    public async getUserAsync(providerData:UserAuthProviderData):Promise<User|undefined>
    {
        return await this.deps.getFirstAsync(IAuthProviderRef,providerData.type,async provider=>{
            return await provider.getUserAsync?.(providerData);
        }) ?? undefined;
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
                this.disposables.add(provider);
                return provider;
            })()
            this.providers[type]=p;
        }
        return await p;
    }

    public async deleteAsync(user:User):Promise<AuthDeleteResult>
    {
        return await this.deps.getFirstAsync(IAuthProviderRef,user.providerData.type,async provider=>{
            return await provider.deleteAsync?.(user);
        }) ?? {
            status:'error',
            message:'No auth provider found'
        }
    }

    public async signInEmailPasswordAsync(email:string,password:string):Promise<AuthSignInResult>
    {
        if(!isValidEmail(email)){
            return {
                success:false,
                message:'Invalid email address'
            }
        }
        return await this.handlerSignInResultAsync(
            await this.deps.getFirstAsync(IAuthProviderRef,null,async provider=>{
                return await provider.signInEmailPasswordAsync?.(email,password);
            })
        );
    }

    public async registerEmailPasswordAsync(email:string,password:string):Promise<AuthRegisterResult>
    {
        if(!isValidEmail(email)){
            return {
                status:'error',
                message:'Invalid email address'
            }
        }
        return await this.handlerRegisterResultAsync(
            await this.deps.getFirstAsync(IAuthProviderRef,null,async provider=>{
                return await provider.registerEmailPasswordAsync?.(email,password);
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

    private async handlerRegisterResultAsync(result:AuthRegisterResult|undefined):Promise<AuthRegisterResult>
    {
        if(!result){
            return {
                status:'error',
                message:'No auth provider found'
            }
        }
        switch(result.status){

            case "success":
                await this.handlerSignInResultAsync({
                    success:true,
                    user:result.user,
                });
                break;

            case "verificationRequired":
                await this.setUserAsync(null,true);
                break;
        }

        return result;
    }

    private async handlerSignInResultAsync(result:AuthSignInResult|undefined):Promise<AuthSignInResult>
    {
        if(!result){
            return {
                success:false,
                message:'No auth provider found'
            }
        }

        if(result.success){
            await this.setUserAsync(result.user,true);
        }

        return result;
    }

    private async setUserAsync(user:User|null,save:boolean)
    {
        if(!user && !usr(this.deps)){
            return;
        }
        if(save){
            if(user){
                await store(this.deps).putAsync<UserAuthProviderData>(providerDataKey,user.providerData);
            }else{
                await store(this.deps).deleteAsync(providerDataKey);
            }
        }
        setUsr(this.deps,user);
    }
}
