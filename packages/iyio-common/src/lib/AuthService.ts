import { BaseUser } from "./BaseUser.js";
import { CancelToken } from "./CancelToken.js";
import { DisposeContainer } from "./DisposeContainer.js";
import { getPopupWindowMessageAsync, sendPopupWindowMessage } from "./PopupWindow.js";
import { RouterStore } from "./RouterStore.js";
import { ScopedSetter } from "./Setter.js";
import { ValueCache } from "./ValueCache.js";
import { _setUser } from "./_internal.common.js";
import { AuthDeleteResult, AuthProvider, AuthRegisterResult, AuthSignInResult, AuthVerificationResult, PasswordResetResult, UserAuthProviderData } from "./auth-types.js";
import { AuthProviders, currentBaseUser } from "./auth.deps.js";
import { breakFunction, continueFunction } from "./common-lib.js";
import { HashMap, IDisposable, IInit } from "./common-types.js";
import { ReadonlySubject } from "./rxjs-types.js";
import { ProviderTypeDef, Scope, TypeDef } from "./scope-types.js";
import { storeRoot } from "./store.deps.js";
import { isValidEmail } from "./validation.js";

const providerDataKey='app-common/Auth/UserAuthProviderData';

export const authServicePopupOAuthCodeMessageId='AuthService/OAuthCode';
export const authServicePopupOAuthSignOutMessageId='AuthService/OAuthSignOut';

export interface AuthServiceOptions
{
    currentUser:ReadonlySubject<BaseUser|null>;
    setUser:ScopedSetter<BaseUser|null>;
    providers:ProviderTypeDef<AuthProvider>;
    store:RouterStore;
}

export class AuthService implements IDisposable, IInit
{

    public static fromScope(scope:Scope){
        return new AuthService({
            currentUser:scope.subject(currentBaseUser),
            setUser:scope.to(_setUser),
            providers:scope.to(AuthProviders),
            store:scope.require(storeRoot)
        })
    }

    private _isDisposed=false;
    public get isDisposed(){return this._isDisposed}
    protected readonly disposables:DisposeContainer=new DisposeContainer();


    private readonly providers:HashMap<Promise<AuthProvider>>={};

    private readonly currentUser:ReadonlySubject<BaseUser|null>;
    private readonly setUser:ScopedSetter<BaseUser|null>;

    private readonly store:RouterStore;

    private readonly authProviders:TypeDef<AuthProvider>;

    /**
     * Used to store data related to the current user. When the user changes userData is cleared.
     */
    public readonly userDataCache:ValueCache=new ValueCache();

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

    public async getUserAsync(providerData:UserAuthProviderData):Promise<BaseUser|undefined>
    {
        return await this.authProviders.getFirstAsync(null,async provider=>{
            return await provider.getUserAsync(providerData)
        }) ?? undefined;
    }

    private async getProviderAsync(type:string):Promise<AuthProvider|undefined>
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

    public async deleteAsync(user:BaseUser):Promise<AuthDeleteResult>
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

    public async resendVerificationCodeAsync(identity:string):Promise<boolean|undefined>
    {
        return await this.authProviders.getFirstAsync(null,async provider=>{
            return await provider.resendVerificationCodeAsync?.(identity);
        });
    }

    public async registerEmailPasswordAsync(email:string,password:string,userData?:HashMap):Promise<AuthRegisterResult>
    {
        if(!isValidEmail(email)){
            return {
                status:'error',
                message:'Invalid email address'
            }
        }
        return await this.handlerRegisterResultAsync(
            await this.authProviders.getFirstAsync(null,async provider=>{
                return await provider.registerEmailPasswordAsync?.(email,password,userData);
            })
        );
    }

    public async verifyAsync(identity:string,code:string):Promise<AuthVerificationResult>
    {
        const result=await this.authProviders.getFirstAsync(null,async provider=>{
            return await provider.verifyAsync?.(identity,code);
        })

        return result??{
            success:false,
            message:'Verification not supported'
        }
    }

    public async signOutAsync():Promise<void>
    {
        const user=this.currentUser.value;
        if(!user){
            return;
        }
        await user.provider.signOutAsync(user);
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

    private async setUserAsync(user:BaseUser|null,save:boolean)
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
        this.userDataCache.clear();
        this.setUser(user);
        await user?.init();
    }

    public async resetPasswordAsync(identity:string):Promise<PasswordResetResult>
    {
        const result=await this.authProviders.getFirstAsync(null,async provider=>{
            return await provider.resetPasswordAsync?.(identity);
        })

        return result??{
            codeSent:false
        };
    }

    public async setNewPasswordAsync(identity:string,code:string,newPassword:string):Promise<boolean>
    {
        const result=await this.authProviders.getFirstAsync(null,async provider=>{
            return await provider.setNewPasswordAsync?.(identity,code,newPassword);
        })

        return result??false;
    }

    /**
     * Refreshes the current user
     */
    public async refreshAsync():Promise<boolean>
    {
        const userData=this.currentUser.value?.providerData;
        if(!userData){
            return false;
        }
        const provider=await this.getProviderAsync(userData.type);
        let user=await provider?.getUserAsync(userData);
        if(user){
            if(provider?.refreshTokenAsync){
                await provider?.refreshTokenAsync?.(user);
                user=await provider?.getUserAsync(userData)??user;
            }

            await this.setUserAsync(user,false);
            return true;
        }else{
            return false;
        }
    }

    public async signInWithTokenAsync(token:any):Promise<AuthSignInResult>{
        return await this.handlerSignInResultAsync(
            await this.authProviders.getFirstAsync(null,async provider=>{
                return await provider.signInWithTokenAsync?.(token);
            })
        );
    }

    public async signInWithCodeAsync(code:string):Promise<AuthSignInResult>{
        return await this.handlerSignInResultAsync(
            await this.authProviders.getFirstAsync(null,async provider=>{
                return await provider.signInWithCodeAsync?.(code);
            })
        );
    }

    public getOAuthSignInLinkUrl(provider:string,options:Record<string,any>={}):string|undefined{
        return this.authProviders.getFirst(null,p=>{
            return p.getOAuthSignInLinkUrl?.(provider,options);
        })
    }

    public async signInWithOAuthUrlAsync(url:string,cancel:CancelToken=new CancelToken()):Promise<AuthSignInResult|undefined>{

        let code:string;

        try{
            code=await getPopupWindowMessageAsync({
                url,
                queryParamTrigger:'code',
                messageId:authServicePopupOAuthCodeMessageId,
            },cancel);
        }catch{
            return {
                success:false,
                message:'Sign-in window popup blocked'
            }
        }

        if(!code){
            return {
                success:false,
                message:'Sign-in code not returned'
            }
        }

        return await this.signInWithCodeAsync(code);
    }

    public async setOAuthCallbackCodeAsync(code:string):Promise<void>{
        sendPopupWindowMessage(authServicePopupOAuthCodeMessageId,code);
    }

    public async setOAuthCallbackSignOutAsync():Promise<void>{
        sendPopupWindowMessage(authServicePopupOAuthSignOutMessageId,true);
    }
}



