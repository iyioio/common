import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers";
import { Credentials, Provider } from "@aws-sdk/types";
import { AwsAuthProvider, awsRegionParam } from '@iyio/aws';
import { AuthDeleteResult, AuthProvider, AuthRegisterResult, AuthSignInResult, AuthVerificationResult, BaseUser, BaseUserOptions, BaseUserUpdate, FactoryTypeDef, HashMap, PasswordResetResult, ReadonlySubject, Scope, UserAuthProviderData, UserFactory, UserFactoryCallback, authServicePopupOAuthSignOutMessageId, currentBaseUser, getPopupWindowMessageAsync, getUriProtocol, httpClient, parseConfigBool, parseJwt, promiseFromErrorResultCallback } from '@iyio/common';
import { AuthenticationDetails, CognitoAccessToken, CognitoIdToken, CognitoRefreshToken, CognitoUser, CognitoUserAttribute, CognitoUserPool, CognitoUserSession, IAuthenticationCallback, ICognitoUserAttributeData, ICognitoUserPoolData } from 'amazon-cognito-identity-js';
import { cognitoDomainPrefixParam, cognitoIdentityPoolIdParam, cognitoOAuthRedirectUriParam, cognitoOAuthScopesParams, cognitoUserPoolClientIdParam, cognitoUserPoolIdParam, disableCognitoUnauthenticatedParam } from './_types.aws-credential-providers.js';

const trackIssuedCreds=parseConfigBool(process.env['NX_TRACK_COGNITO_ISSUED_CREDS']??process.env['NX_PUBLIC_TRACK_COGNITO_ISSUED_CREDS']);

/**
 * Used for testing
 */
export const _allIssuedCognitoCreds:Provider<Credentials>[]=[];

const sessionKey=Symbol('cognitoSession');
const userKey=Symbol('cognitoUser');

export const CognitoAuthProviderType='CognitoAuthProvider';

export interface CognitoAuthProviderConfig extends ICognitoUserPoolData
{
    region:string;
    identityPoolId:string;
    currentUser:ReadonlySubject<BaseUser|null>;
    userFactory:FactoryTypeDef<UserFactoryCallback>;
}

export class CognitoAuthProvider implements AuthProvider, AwsAuthProvider
{

    public static fromScope(scope:Scope){
        return new CognitoAuthProvider({
            UserPoolId:cognitoUserPoolIdParam(scope),
            ClientId:cognitoUserPoolClientIdParam(scope),
            identityPoolId:cognitoIdentityPoolIdParam(scope),
            region:awsRegionParam(scope),
            currentUser:scope.subject(currentBaseUser),
            userFactory:scope.to(UserFactory)
        });
    }

    public readonly type=CognitoAuthProviderType;

    public readonly config:Readonly<CognitoAuthProviderConfig>;

    private readonly userPool:CognitoUserPool;

    private readonly currentUser:ReadonlySubject<BaseUser|null>;

    constructor(config:CognitoAuthProviderConfig)
    {
        this.userPool=new CognitoUserPool(config);
        this.config=config;
        this.currentUser=config.currentUser;
    }

    private unCreds:Provider<Credentials>|null=null;
    public getUnauthenticatedCredentials():Provider<Credentials>{
        if(!this.unCreds){
            this.unCreds=fromCognitoIdentityPool({
                identityPoolId:this.config.identityPoolId,
                clientConfig:{
                    region:this.config.region,
                }
            });
        }
        return this.unCreds;
    }

    public getAuthProvider():Provider<Credentials>|undefined
    {
        return this.getCredentials;
    }

    private readonly getCredentials=async ():Promise<Credentials>=>{
        const user=this.currentUser.value;
        if(!user){
            if(disableCognitoUnauthenticatedParam.get()){
                throw new Error('Unauthenticated cognito users disabled')
            }
            return await this.getUnauthenticatedCredentials()();
        }

        let session:CognitoUserSession|undefined=user.providerData.providerData?.[sessionKey];
        if(!session){
            if(disableCognitoUnauthenticatedParam.get()){
                throw new Error('Unauthenticated cognito users disabled')
            }
            return await this.getUnauthenticatedCredentials()();
        }

        if(!session.isValid()){
            console.info('getAuthProvider','refresh session')
            const cognitoUser:CognitoUser=user.providerData.providerData?.[userKey];
            if(cognitoUser){
                const refreshToken=session.getRefreshToken();
                const newSession=await promiseFromErrorResultCallback<CognitoUserSession>(
                    cb=>cognitoUser.refreshSession(refreshToken,cb));


                if(newSession){
                    session=newSession;
                    if(user.providerData.providerData){
                        user.providerData.providerData[sessionKey]=newSession;
                    }
                }
            }
        }

        const token=session.getIdToken().getJwtToken();

        const provider=fromCognitoIdentityPool({
            identityPoolId:this.config.identityPoolId,
            logins:{
                [`cognito-idp.${this.config.region}.amazonaws.com/${this.config.UserPoolId}`]:token
            },
            clientConfig:{
                region:this.config.region,
            }
        });

        if(trackIssuedCreds){
            _allIssuedCognitoCreds.push(provider);
        }

        return await provider();
    }

    public async getCurrentUser():Promise<BaseUser|null>{
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

    private async convertCognitoUserAsync(user:CognitoUser):Promise<BaseUser>
    {
        let session=await promiseFromErrorResultCallback<CognitoUserSession|null>(cb=>user.getSession(cb));
        if(session){

            if(!session.isValid()){

                const refreshToken=session.getRefreshToken();
                const newSession=await promiseFromErrorResultCallback<CognitoUserSession>(
                    cb=>user.refreshSession(refreshToken,cb));

                if(newSession){
                    session=newSession;
                }

            }

            const atts=await promiseFromErrorResultCallback<CognitoUserAttribute[]|undefined>(cb=>user.getUserAttributes(cb));
            const id=user.getUsername();
            const data:HashMap<string>={};
            if(atts){
                for(const att of atts){
                    data[att.Name]=att.Value
                }
            }
            const name=data['nickname']??id;
            const email=data['email'];
            const phoneNumber=data['phone']??data['phone_number']??data['phoneNumber'];
            const options:BaseUserOptions={
                id,
                name,
                email,
                phoneNumber,
                data,
                providerData:{
                    type:this.type,
                    userId:id,
                    providerData:{
                        [sessionKey]:session,
                        [userKey]:user
                    }
                },
                provider:this
            }

            const baseUser=this.config.userFactory.generate(options);
            if(!baseUser){
                throw new Error('No user factory provided a user');
            }

            return baseUser;
        }else{
            throw new Error('Unable to get user session');
        }
    }

    private async getIdentitiesAsync(user:CognitoUser):Promise<Ident[]|undefined>{
        try{
            const atts=await promiseFromErrorResultCallback<CognitoUserAttribute[]|undefined>(cb=>user.getUserAttributes(cb));
            if(!atts){
                return undefined;
            }
            const idAtt=atts.find(a=>a.Name==='identities');
            if(!idAtt){
                return undefined;
            }
            try{
                const identities=JSON.parse(idAtt.Value);
                return identities??((typeof identities==='object')?identities:undefined);
            }catch{
                return undefined;
            }
        }catch{
            return undefined;
        }
    }

    public async getUserAsync(data: UserAuthProviderData):Promise<BaseUser|null> {
        const user:CognitoUser|undefined=data.providerData?.[userKey];
        if(!user){
            if(!data.userId){
                return null;
            }
            const currentUser=await this.getCurrentUser();
            return currentUser?.id===data.userId?currentUser:null;
        }
        return await this.convertCognitoUserAsync(user);
    }
    public async deleteAsync(user: BaseUser): Promise<AuthDeleteResult | undefined> {
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
    public async signOutAsync(user: BaseUser): Promise<void> {
        const cUser:CognitoUser|undefined=user.providerData.providerData?.[userKey];
        if(!cUser){
            return;
        }
        const prefix=cognitoDomainPrefixParam.get();
        if(prefix){
            const ids=await this.getIdentitiesAsync(cUser);
            if(ids){
                const url=(
                    `https://${
                        prefix
                    }.auth.${
                        awsRegionParam()
                    }.amazoncognito.com/logout?client_id=${
                        cognitoUserPoolClientIdParam()
                    }&logout_uri=${
                        this.getOAuthRedirectUri()
                    }`
                )
                await getPopupWindowMessageAsync({
                    url,
                    triggerOnSameHost:true,
                    timeoutMs:30000,
                    messageId:authServicePopupOAuthSignOutMessageId
                });
            }
        }
        await new Promise<void>((resolve)=>{
            cUser.signOut(()=>resolve())
        });
    }

    public async getJwtAsync(data:UserAuthProviderData):Promise<string|null>
    {
        return (data.providerData?.[sessionKey] as CognitoUserSession|undefined)?.getIdToken()?.getJwtToken()??null
    }

    public async getClaimsAsync(data:UserAuthProviderData):Promise<Record<string,any>|null>{
        const jwt=await this.getJwtAsync(data);
        if(!jwt){
            return null;
        }
        return parseJwt(jwt);
    }

    public async signInWithTokenAsync(token:any):Promise<AuthSignInResult>
    {

        const idToken=token?.IdToken??token?.id_token;
        const accessToken=token?.AccessToken??token?.access_token;
        const refreshToken=token?.RefreshToken??token?.refresh_token;

        const session=new CognitoUserSession({
            IdToken:(typeof idToken === 'string')?new CognitoIdToken({IdToken:idToken}):idToken,
            AccessToken:(typeof accessToken === 'string')?new CognitoAccessToken({AccessToken:accessToken}):accessToken,
            RefreshToken:(typeof refreshToken === 'string')?new CognitoRefreshToken({RefreshToken:refreshToken}):refreshToken,
        });

        if(!session.isValid()){
            return {
                success:false,
                message:'Invalid session from token'
            }
        }



        const cognitoUser=new CognitoUser({
            Username:session.getAccessToken().payload['username']??'user',
            Pool:this.userPool,
        })

        cognitoUser.setSignInUserSession(session);


        const user=await this.convertCognitoUserAsync(cognitoUser);
        return {
            success:true,
            user,
        }

    }

    private getOAuthRedirectUri()
    {
        let redirectUri=cognitoOAuthRedirectUriParam();
        if(!getUriProtocol(redirectUri)){
            if(redirectUri.startsWith('/')){
                redirectUri=redirectUri.substring(1);
            }
            redirectUri=`${globalThis.location?.protocol??'https:'}//${globalThis.location?.host??'localhost'}/${redirectUri}`
        }
        return redirectUri;
    }

    public async signInWithCodeAsync(code:string):Promise<AuthSignInResult>
    {

        const token=await httpClient().postAsync<any>(
            `https://${cognitoDomainPrefixParam()}.auth.${awsRegionParam()}.amazoncognito.com/oauth2/token`,
            {
                code,
                client_id:cognitoUserPoolClientIdParam(),
                grant_type:'authorization_code',
                redirect_uri:this.getOAuthRedirectUri(),
            },{
                urlEncodeBody:true,
                noAuth:true,

            }
        )

        return await this.signInWithTokenAsync(token);

    }

    public getOAuthSignInLinkUrl(provider:string,options:Record<string,any>):string|undefined
    {
        const prefix=cognitoDomainPrefixParam.get();
        if(!prefix){
            return undefined;
        }

        const scopes:string|undefined=(typeof options['scopes'] === 'string')?options['scopes']:undefined;

        return (
            `https://${
                prefix
            }.auth.${
                awsRegionParam()
            }.amazoncognito.com/oauth2/authorize?client_id=${
                cognitoUserPoolClientIdParam()
            }&response_type=code&scope=${
                encodeURIComponent((scopes??cognitoOAuthScopesParams()).split(',').map(s=>s.trim()).join(' '))
            }&redirect_uri=${
                encodeURIComponent(this.getOAuthRedirectUri())
            }`
        )

    }

    public async signInEmailPasswordAsync(email: string, password: string, newPassword?:string): Promise<AuthSignInResult> {

        return new Promise<AuthSignInResult>((resolve)=>{
            const details=new AuthenticationDetails({
                Username:email,
                Password:password
            });

            const cognitoUser=new CognitoUser({
                Username:email,
                Pool:this.userPool,
            });
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

    public async registerEmailPasswordAsync(
        email:string,
        password:string,
        userData?:HashMap,
    ):Promise<AuthRegisterResult|undefined>{

        return new Promise<AuthRegisterResult|undefined>((resolve)=>{

            const atts:CognitoUserAttribute[]=[
                new CognitoUserAttribute({
                    Name:'email',
                    Value:email
                })
            ]

            if(userData){
                for(const e in userData){
                    if(!atts.find(a=>a.Name===e)){
                        atts.push(new CognitoUserAttribute({
                            Name:e,
                            Value:userData[e]?.toString()??'',
                        }))
                    }
                }
            }

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
                            message:result.success===false?result.message:'error',
                            error:result.success===false?result.error:null
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

    public resendVerificationCodeAsync(identity:string):Promise<boolean>
    {
        return new Promise<boolean>((resolve)=>{
            const cognitoUser=new CognitoUser({
                Username:identity,
                Pool:this.userPool,
            });
            cognitoUser.resendConfirmationCode((err)=>{

                if(err){
                    resolve(false)
                    return;
                }

                resolve(true)
            })
        });
    }

    public verifyAsync(identity:string,code:string):Promise<AuthVerificationResult>
    {
        return new Promise<AuthVerificationResult>((resolve)=>{
            const cognitoUser=new CognitoUser({
                Username:identity,
                Pool:this.userPool,
            });
            cognitoUser.confirmRegistration(code,true,(err)=>{

                if(err){
                    resolve({
                        success:false,
                        message:'Verification failed',
                        error:err
                    })
                    return;
                }

                resolve({
                    success:true,
                    message:'Verification complete'
                })
            })
        });
    }

    public async updateAsync(user:BaseUser,update:BaseUserUpdate):Promise<boolean>
    {
        const cUser:CognitoUser|undefined=user.providerData.providerData?.[userKey];
        if(!cUser){
            return false;
        }

        const atts:ICognitoUserAttributeData[]=[];
        const add=(name:string,value:string)=>{
            if(!atts.some(a=>a.Name===name)){
                atts.push({Name:name,Value:value})
            }
        }

        if(update.name){
            add('nickname',update.name);
        }

        if(update.data){
            for(const e in update.data){
                add(e,update.data[e]);
            }
        }

        if(!atts.length){
            return false;
        }

        await promiseFromErrorResultCallback(cb=>cUser.updateAttributes(atts,cb));

        return true;
    }

    public async resetPasswordAsync(identity:string):Promise<PasswordResetResult>
    {
        try{
            const cognitoUser=new CognitoUser({
                Username:identity,
                Pool:this.userPool,
            });
            const {codeSentTo}=await promiseFromErrorResultCallback(cb=>cognitoUser.forgotPassword({
                onSuccess:()=>{/* */},
                onFailure:err=>cb(err,undefined),
                inputVerificationCode:code=>{
                    cb(null,{
                        codeSentTo:code?.CodeDeliveryDetails?.Destination
                    })
                }
            }));

            return {
                codeSent:true,
                codeSentTo
            };
        }catch(ex){
            return {
                error:ex,
                codeSent:false
            }
        }
    }

    public async setNewPasswordAsync(identity:string,code:string,newPassword:string):Promise<boolean>
    {
        const cognitoUser=new CognitoUser({
            Username:identity,
            Pool:this.userPool,
        });
        return await promiseFromErrorResultCallback(cb=>cognitoUser.confirmPassword(code,newPassword,{
            onSuccess:()=>cb(null,true),
            onFailure:err=>cb(err,undefined as any),
        }));
    }

    public async refreshTokenAsync(user:BaseUser):Promise<boolean>
    {
        const cUser:CognitoUser|undefined=user.providerData.providerData?.[userKey];
        if(!cUser){
            return false;
        }

        const session=await promiseFromErrorResultCallback<CognitoUserSession|null>(cb=>cUser.getSession(cb));

        if(!session){
            return false;
        }

        await promiseFromErrorResultCallback(cb=>cUser.refreshSession(session.getRefreshToken(),cb));

        return true;
    }

}

interface Ident{
    userId?:string|null;
    providerName?:string|null;
    providerType?:string|null;
    [key:string]:any;
}
