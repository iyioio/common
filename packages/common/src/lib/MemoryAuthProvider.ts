import { aryRemoveFirst } from "./array";
import { AuthDeleteResult, AuthRegisterResult, AuthSignInResult, IAuthProvider, UserAuthProviderData } from "./auth-types";
import { BaseUser } from "./BaseUser";
import { delayAsync } from "./common-lib";
import { shortUuid } from "./uuid";

interface MemoryUserRecord
{
    password?:string;
    email?:string;
    user:BaseUser;
}

export class MemoryAuthProvider implements IAuthProvider
{

    public readonly type='MemoryAuthProvider';

    private readonly users:MemoryUserRecord[]=[];

    /**
     * Number of milliseconds to delay auth options
     */
    public delayMs:number=0;

    private _isDisposed=false;
    public get isDisposed(){return this._isDisposed}


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
    public async registerEmailPasswordAsync(email: string, password: string): Promise<AuthRegisterResult | undefined> {
        await this.delayAsync();

        if(this.users.find(u=>u.email===email)){
            return {
                status:'error',
                message:'Email already registered'
            }
        }

        const id=shortUuid();
        const record:MemoryUserRecord={
            email,
            password,
            user:new BaseUser(id,email,{
                userId:id,
                type:this.type,
            })
        }
        this.users.push(record);

        return {
            status:'success',
            user:record.user,
        }
    }
}
