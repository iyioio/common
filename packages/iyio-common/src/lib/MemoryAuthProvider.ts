import { aryRemoveFirst } from "./array.js";
import { AuthDeleteResult, AuthProvider, AuthRegisterResult, AuthSignInResult, UserAuthProviderData, UserFactoryCallback } from "./auth-types.js";
import { UserFactory } from "./auth.deps.js";
import { BaseUser, BaseUserOptions } from "./BaseUser.js";
import { delayAsync } from "./common-lib.js";
import { HashMap } from "./common-types.js";
import { FactoryTypeDef, Scope } from "./scope-types.js";
import { shortUuid } from "./uuid.js";

interface MemoryUserRecord
{
    password?:string;
    email?:string;
    user:BaseUser;
}

export interface MemoryAuthProviderOptions
{
    userFactory:FactoryTypeDef<UserFactoryCallback>;
}

export class MemoryAuthProvider implements AuthProvider
{

    public static fromScope(scope:Scope)
    {
        return new MemoryAuthProvider({
            userFactory:scope.to(UserFactory)
        })
    }

    private readonly options:MemoryAuthProviderOptions;

    public readonly type='MemoryAuthProvider';

    private readonly users:MemoryUserRecord[]=[];

    /**
     * Number of milliseconds to delay auth options
     */
    public delayMs:number=0;

    private _isDisposed=false;
    public get isDisposed(){return this._isDisposed}

    public constructor(options:MemoryAuthProviderOptions)
    {
        this.options=options;
    }


    public dispose()
    {
        if(this._isDisposed){
            return;
        }
        this._isDisposed=true;
    }

    private async delayAsync()
    {
        if(this.delayMs>0){
            await delayAsync(this.delayMs);
        }
    }

    public async getUserAsync(data: UserAuthProviderData): Promise<BaseUser | null> {
        await this.delayAsync();
        return this.users.find(u=>u.user.id===data.userId)?.user??null;
    }

    public async deleteAsync(user:BaseUser):Promise<AuthDeleteResult|undefined>{
        await this.delayAsync();
        const deleted=aryRemoveFirst(this.users,r=>r.user.id===user.id);
        if(deleted){
            return {
                status:'success',
            }
        }else{
            return {
                status:'error',
                message:'No matching user found'
            }
        }
    }

    public async signOutAsync(): Promise<void> {
        await this.delayAsync();

    }
    public async signInEmailPasswordAsync(email: string, password: string): Promise<AuthSignInResult | undefined> {
        await this.delayAsync();
        const user=this.users.find(u=>u.email===email && u.password===password)?.user;
        if(user){
            return {
                success:true,
                user
            }
        }else{
            return {
                success:false,
                message:'Incorrect email or password'
            }
        }
    }
    public async registerEmailPasswordAsync(
        email:string,
        password:string,
        userData?:HashMap
    ):Promise<AuthRegisterResult|undefined>{

        await this.delayAsync();

        if(this.users.find(u=>u.email===email)){
            return {
                status:'error',
                message:'Email already registered'
            }
        }

        const id=shortUuid();

        const options:BaseUserOptions={
            id,
            name:email,
            providerData:{
                type:this.type,
                userId:id,
            },
            data:userData,
            provider:this,
        }

        const baseUser=this.options.userFactory.generate(options);
        if(!baseUser){
            throw new Error('Unable to get user from factory');
        }

        const record:MemoryUserRecord={
            email,
            password,
            user:baseUser
        }
        this.users.push(record);

        return {
            status:'success',
            user:record.user,
        }
    }
}
