import { breakFunction, continueFunction, DisposeContainer, HashMap, IDisposable, IInit, isValidEmail, ReadonlySubject, Scope, ScopedSetter, TypeDef } from "@iyio/common";
import { RouterStore, storeService } from "@iyio/key-value-store";
import { AuthDeleteResult, AuthRegisterResult, AuthSignInResult, IAuthProvider, UserAuthProviderData } from "./auth-types";
import { User } from "./User";
import { _setUser } from "./_internal.app-common";
import { currentUser, IAuthProviderType } from "./_types.app-common";

const providerDataKey='app-common/Auth/UserAuthProviderData';

export interface AuthServiceOptions
{
    currentUser:ReadonlySubject<User|null>;
    setUser:ScopedSetter<User|null>;
    providers:TypeDef<IAuthProvider>;
    store:RouterStore;
}

export class AuthService implements IDisposable, IInit
{

    public static fromScope(scope:Scope){
        return new AuthService({
            currentUser:scope.subject(currentUser),
            setUser:scope.to(_setUser),
            providers:scope.to(IAuthProviderType),
            store:scope.require(storeService)
        })
    }

    private _isDisposed=false;
    public get isDisposed(){return this._isDisposed}
    protected readonly disposables:DisposeContainer=new DisposeContainer();


    private readonly providers:HashMap<Promise<IAuthProvider>>={};

    private readonly currentUser:ReadonlySubject<User|null>;
    private readonly setUser:ScopedSetter<User|null>;

    private readonly store:RouterStore;

    private readonly authProviders:TypeDef<IAuthProvider>;

    public constructor({
        currentUser,
        setUser,
        providers,
        store
    }:AuthServiceOptions)
    {
        this.currentUser=currentUser;
        this.setUser=setUser;
        this.authProviders=providers;
        this.store=store;
    }


    public async init():Promise<void>
    {
        const userData=await this.store.getAsync<UserAuthProviderData>(providerDataKey);

        if(userData){
            const provider=await this.getProviderAsync(userData.type);
            const user=await provider?.getUserAsync(userData);
            if(user){
                await this.setUserAsync(user,false);
            }
        }else{
            await this.authProviders.forEachAsync(null,async p=>{
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
        return await this.authProviders.getFirstAsync(null,async provider=>{
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
            const provider=this.authProviders.get(type);
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
        return await this.authProviders.getFirstAsync(null,async provider=>{
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
            await this.authProviders.getFirstAsync(null,async provider=>{
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
            await this.authProviders.getFirstAsync(null,async provider=>{
                return await provider.registerEmailPasswordAsync?.(email,password);
            })
        );
    }

    public async signOutAsync():Promise<void>
    {
        const user=this.currentUser.value;
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
        if(!user && !this.currentUser.value){
            return;
        }
        if(save){
            if(user){
                await this.store.putAsync<UserAuthProviderData>(providerDataKey,user.providerData);
            }else{
                await this.store.deleteAsync(providerDataKey);
            }
        }
        this.setUser(user);
    }
}
