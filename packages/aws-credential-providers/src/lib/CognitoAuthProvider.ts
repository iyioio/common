import { AuthDeleteResult, AuthRegisterResult, AuthSignInResult, IAuthProvider, User, UserAuthProviderData } from '@iyio/app-common';
import { DependencyContainer } from '@iyio/common';
import { AuthenticationDetails, CognitoUser, CognitoUserAttribute, CognitoUserPool, CognitoUserSession, IAuthenticationCallback } from 'amazon-cognito-identity-js';
import { COGNITO_USER_POOL_CLIENT_ID, COGNITO_USER_POOL_ID } from './_config.aws-credential-providers';


const sessionKey=Symbol('cognitoSession');
const userKey=Symbol('cognitoUser');

export class CognitoAuthProvider implements IAuthProvider
{
    public readonly type='CognitoAuthProvider';

    private readonly userPool:CognitoUserPool;

    private readonly deps:DependencyContainer;

    private storage?:Storage;

    constructor(deps:DependencyContainer, storage?:Storage)
    {
        this.deps=deps;
        this.storage=storage;
        this.userPool=new CognitoUserPool({
            Storage:storage,
            UserPoolId:COGNITO_USER_POOL_ID.require(this.deps),
            ClientId:COGNITO_USER_POOL_CLIENT_ID.require(this.deps),
        });
    }

    public async getCurrentUser():Promise<User|null>{
        try{

            const cognitoUser=this.userPool.getCurrentUser();
            if(cognitoUser){
                const user=await this.convertCognitoUserAsync(cognitoUser);
                return user??null;
            }
        }catch(ex){
            console.error('User initialization failed',ex);
        }
        return null;
    }

    private convertCognitoUserAsync(user:CognitoUser):Promise<User>
    {
        if(this.storage){
            user=new CognitoUser({
                Storage:this.storage,
                Username:user.getUsername(),
                Pool:this.userPool
            })
        }
        return new Promise<User>((resolve,reject)=>{
            user.getSession((error:Error|null,session:CognitoUserSession|null)=>{
                if(session){
                    const id=user.getUsername();
                    resolve(new User(id,id,{
                        type:this.type,
                        userId:id,
                        providerData:{
                            [sessionKey]:session,
                            [userKey]:user
                        }
                    }))
                }else{
                    reject(error??new Error('Unable to get user session'))
                }
            })
        })
    }

    public async getUserAsync(data: UserAuthProviderData):Promise<User|null> {
        const user:CognitoUser|undefined=data.providerData?.[userKey];
        if(!user){
            return null;
        }
        return await this.convertCognitoUserAsync(user);
    }
    public async deleteAsync(user: User): Promise<AuthDeleteResult | undefined> {
        const cUser:CognitoUser|undefined=user.providerData.providerData?.[userKey];
        if(!cUser){
            return;
        }
        return await new Promise<AuthDeleteResult | undefined>((resolve)=>{
            cUser.deleteUser((err)=>{
                if(err){
                    resolve({
                        status:'error',
                        message:'Delete user failed',
                        error:err
                    })
                }else{
                    resolve({
                        status:'success'
                    })
                }
        })
        });
    }
    public async signOutAsync(user: User): Promise<void> {
        const cUser:CognitoUser|undefined=user.providerData.providerData?.[userKey];
        if(!cUser){
            return;
        }
        await new Promise<void>((resolve)=>{
            cUser.signOut(()=>resolve())
        });
    }
    public async signInEmailPasswordAsync(email: string, password: string, newPassword?:string): Promise<AuthSignInResult> {

        return new Promise<AuthSignInResult>((resolve)=>{
            const details=new AuthenticationDetails({
                Username:email,
                Password:password
            });


            const userData={
                Username:email,
                Pool:this.userPool,
            }

            const cognitoUser=new CognitoUser(userData);
            const callbacks:IAuthenticationCallback={
                onSuccess:async (session,confirmationNeeded)=>{
                    if(confirmationNeeded){
                        resolve({
                            success:false,
                            message:'Confirmation required'
                        })
                        return;
                    }
                    const user=await this.convertCognitoUserAsync(cognitoUser);
                    resolve({
                        success:true,
                        user
                    })
                },
                onFailure:(err)=>{
                    resolve({
                        success:false,
                        message:'Sign-in failed',
                        error:err
                    })
                },
                newPasswordRequired:()=>{
                    if(newPassword){
                        cognitoUser.completeNewPasswordChallenge(newPassword,{},callbacks);
                    }else{
                        resolve({
                            success:false,
                            message:'New password required'
                        })
                    }
                }
            }
            cognitoUser.authenticateUser(details,callbacks);
        });
    }

    public async registerEmailPasswordAsync?(email: string, password: string): Promise<AuthRegisterResult | undefined> {
        return new Promise<AuthRegisterResult|undefined>((resolve)=>{

            const atts:CognitoUserAttribute[]=[
                new CognitoUserAttribute({
                    Name:'email',
                    Value:email
                })
            ]

            this.userPool.signUp(email,password,atts,[],async (err,result)=>{
                if(err || !result?.user){
                    resolve({
                        status:'error',
                        message:'Register failed',
                        error:err
                    })

                }else if(result.userConfirmed){

                    const result=await this.signInEmailPasswordAsync(email,password);

                    if(result.success){
                        resolve({
                            status:'success',
                            user:result.user
                        })
                    }else{
                        resolve({
                            status:'error',
                            message:result.message,
                            error:result.error
                        })
                    }
                }else{
                    resolve({
                        status:'verificationRequired',
                        message:`A verification code has been sent to ${email}`,
                        verificationDestination:email
                    })
                }
            })
        });
    }

}
