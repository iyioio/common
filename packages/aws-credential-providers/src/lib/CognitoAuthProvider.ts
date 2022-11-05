import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers";
import { Credentials, Provider } from "@aws-sdk/types";
import { AuthDeleteResult, AuthRegisterResult, AuthSignInResult, currentUser, IAuthProvider, User, UserAuthProviderData } from '@iyio/app-common';
import { awsRegionParam, IAwsAuth } from '@iyio/aws';
import { HashMap, parseConfigBool, ReadonlySubject, Scope } from '@iyio/common';
import { AuthenticationDetails, CognitoUser, CognitoUserAttribute, CognitoUserPool, CognitoUserSession, IAuthenticationCallback, ICognitoUserPoolData } from 'amazon-cognito-identity-js';
import {
    cognitoIdentityPoolIdParam,
    cognitoUserPoolClientIdParam,
    cognitoUserPoolIdParam
} from './_types.aws-credential-providers';

const trackIssuedCreds=parseConfigBool(process.env['NX_TRACK_COGNITO_ISSUED_CREDS']);

/**
 * Used for testing
 */
export const _allIssuedCognitoCreds:Provider<Credentials>[]=[];


const sessionKey=Symbol('cognitoSession');
const userKey=Symbol('cognitoUser');

export interface CognitoAuthProviderConfig extends ICognitoUserPoolData
{
    region:string;
    identityPoolId:string;
    currentUser:ReadonlySubject<User|null>;
}

export class CognitoAuthProvider implements IAuthProvider, IAwsAuth
{

    public static fromScope(scope:Scope){
        return new CognitoAuthProvider({
            UserPoolId:cognitoUserPoolIdParam(scope),
            ClientId:cognitoUserPoolClientIdParam(scope),
            identityPoolId:cognitoIdentityPoolIdParam(scope),
            region:awsRegionParam(scope),
            currentUser:scope.subject(currentUser)
        });
    }

    public readonly type='CognitoAuthProvider';

    public readonly config:Readonly<CognitoAuthProviderConfig>;

    private readonly userPool:CognitoUserPool;

    private readonly currentUser:ReadonlySubject<User|null>;

    constructor(config:CognitoAuthProviderConfig)
    {
        this.userPool=new CognitoUserPool(config);
        this.config=config;
        this.currentUser=config.currentUser;
    }

    private readonly providerMap:HashMap<Provider<Credentials>>={};
    public getAuthProvider():Provider<Credentials>|undefined
    {
        const user=this.currentUser.value;
        if(!user){
            return undefined;
        }

        const session:CognitoUserSession|undefined=user.providerData.providerData?.[sessionKey];
        if(!session){
            return undefined;
        }

        const token=session.getIdToken().getJwtToken();

        let provider:Provider<Credentials>=this.providerMap[token];
        if(provider){
            return provider;
        }

        provider=fromCognitoIdentityPool({
            identityPoolId:this.config.identityPoolId,
            logins:{
                [`cognito-idp.${this.config.region}.amazonaws.com/${this.config.UserPoolId}`]:token
            },
            clientConfig:{
                region:this.config.region,
            }
        });

        const cached=cacheCreds(provider);

        if(trackIssuedCreds){
            _allIssuedCognitoCreds.push(cached);
        }

        return this.providerMap[token]=cached;

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

const cacheCreds=(provider:Provider<Credentials>):Provider<Credentials>=>{
    let credsPromise:Promise<Credentials>|null=null;
    let t=Date.now();

    return async ()=>{
        if(!credsPromise || (Date.now()-t)>1000*60*3){
            t=Date.now();
            credsPromise=provider();
        }
        return await credsPromise;
    }
}
