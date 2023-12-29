import { cognitoIdentityPoolIdParam, cognitoUserPoolClientIdParam, cognitoUserPoolIdParam } from '@iyio/aws-credential-providers';
import * as cdk from 'aws-cdk-lib';
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Construct } from 'constructs';
import { ManagedProps, getDefaultManagedProps } from './ManagedProps';
import { AccessGranter, AccessRequest, AccessRequestDescription, IAccessRequestGroup } from './cdk-types';

export type TriggerMap={
    [prop in keyof cognito.UserPoolTriggers]:string|lambda.IFunction;
};

export interface UserPoolBuilderProps{
    name?:string;
    grantAccess?:boolean;
    managed?:ManagedProps;
    authorizedAccessRequests?:AccessRequestDescription[];
    unauthorizedAccessRequests?:AccessRequestDescription[];
    triggers?:TriggerMap;
    domainPrefix?:string;
    providers?:string[];
    googleClientId?:string;
    googleClientSecret?:string;
    oAuthCallbackUrls?:string[];
}

export class UserPoolBuilder extends Construct implements IAccessRequestGroup
{
    public readonly userPool:cognito.UserPool;
    public readonly userPoolClient:cognito.UserPoolClient;
    public readonly idPool:cognito.CfnIdentityPool;
    public readonly cognitoUserRole:iam.Role;
    public readonly anonCognitoUserRole:iam.Role;

    public readonly accessRequests:AccessRequest[]=[];

    public readonly accessGrants:AccessGranter[]=[];



    public constructor(scope_:Construct,id:string,{
        managed:{
            params,
            accessManager,
            fns,
        }=getDefaultManagedProps(),
        name,
        grantAccess,
        triggers,
        authorizedAccessRequests,
        unauthorizedAccessRequests,
        domainPrefix,
        providers,
        googleClientId,
        googleClientSecret,
        oAuthCallbackUrls=domainPrefix?[`https://${domainPrefix}`]:undefined
    }:UserPoolBuilderProps){

        super(scope_,id);

        const lambdaTriggers:cognito.UserPoolTriggers={};

        if(triggers){
            for(const e in triggers){
                const t=triggers[e];
                if(typeof t === 'string'){
                    const fn=fns?.find(f=>f.name===t);
                    if(!fn){
                        throw new Error(
                            `Unable to find lambda trigger for UserPoolBuilder. id:${id}, lambdaName:${t}`);
                    }
                    lambdaTriggers[e]=fn.fn;
                    params?.excludeParamFrom(fn.name,
                        cognitoIdentityPoolIdParam,cognitoUserPoolClientIdParam,cognitoUserPoolIdParam
                    );
                }else if(t){
                    lambdaTriggers[e]=t;
                }
            }
        }


        // User Pool
        const userPool = new cognito.UserPool(this, "UserPool", {
            selfSignUpEnabled: true,
            signInAliases: {
                email: true,
            },
            standardAttributes: {
            },
            customAttributes: {
                isAdmin: new cognito.StringAttribute({ mutable: true }),
            },
            passwordPolicy: {
                minLength: 6,
                requireLowercase: true,
                requireDigits: true,
                requireUppercase: false,
                requireSymbols: false,
            },
            accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            lambdaTriggers
        });

        if(domainPrefix){
            userPool.addDomain('default',{
                cognitoDomain:{
                    domainPrefix
                }
            })
        }
        const useGoogle=providers?.includes('google');
        if(useGoogle){
            googleClientId=googleClientId??process.env['GOOGLE_CLIENT_ID'];
            googleClientSecret=googleClientSecret??process.env['GOOGLE_CLIENT_SECRET'];
            if(googleClientId && googleClientSecret){
                new cognito.UserPoolIdentityProviderGoogle(this,'Google',{
                    userPool,
                    clientId:googleClientId,
                    clientSecretValue:cdk.SecretValue.unsafePlainText(googleClientSecret),
                    scopes:['email'],
                    attributeMapping:{
                        email:cognito.ProviderAttribute.GOOGLE_EMAIL,
                        givenName:cognito.ProviderAttribute.GOOGLE_NAME,
                    }
                })
            }
        }

        const standardCognitoAttributes:cognito.StandardAttributesMask = {
            givenName: true,
            familyName: true,
            email: true,
            emailVerified: true,
            address: true,
            birthdate: true,
            gender: true,
            locale: true,
            middleName: true,
            fullname: true,
            nickname: true,
            phoneNumber: true,
            phoneNumberVerified: true,
            profilePicture: true,
            preferredUsername: true,
            profilePage: true,
            timezone: true,
            lastUpdateTime: true,
            website: true,
        };

        const clientReadAttributes = new cognito.ClientAttributes()
            .withStandardAttributes(standardCognitoAttributes)
            .withCustomAttributes("isAdmin");

        const clientWriteAttributes = new cognito.ClientAttributes()
            .withStandardAttributes({
                ...standardCognitoAttributes,
                emailVerified: false,
                phoneNumberVerified: false,
            })
            .withCustomAttributes();

        // User Pool Client
        const userPoolClient = new cognito.UserPoolClient(
            this,
            "UserPoolClient",
            {
                userPool,
                authFlows: {
                    adminUserPassword: true,
                    custom: true,
                    userSrp: true,
                },
                supportedIdentityProviders: [
                    cognito.UserPoolClientIdentityProvider.COGNITO,
                    useGoogle?cognito.UserPoolClientIdentityProvider.GOOGLE:undefined,
                ].filter(v=>v) as cognito.UserPoolClientIdentityProvider[],
                readAttributes: clientReadAttributes,
                writeAttributes: clientWriteAttributes,
                oAuth:(useGoogle && oAuthCallbackUrls)?{
                    callbackUrls:oAuthCallbackUrls
                }:undefined
            }
        );


        const idPool = new cognito.CfnIdentityPool(this, "IdentityPool", {
            allowUnauthenticatedIdentities: true,
            cognitoIdentityProviders: [{
                clientId:userPoolClient.userPoolClientId,
                providerName:userPool.userPoolProviderName
            }]
        });

        const cognitoUserRole = new iam.Role(this, "cognitoUserRole", {
            description: "Default role for authenticated cognito users",
            assumedBy: new iam.FederatedPrincipal(
                "cognito-identity.amazonaws.com",
                {
                    StringEquals: {
                        "cognito-identity.amazonaws.com:aud": idPool.ref,
                    },
                    "ForAnyValue:StringLike": {
                        "cognito-identity.amazonaws.com:amr": "authenticated",
                    },
                },
                "sts:AssumeRoleWithWebIdentity"
            )
        });

        const anonCognitoUserRole = new iam.Role(this, "anonCognitoUserRole", {
            description: "Default role for unauthenticated cognito users",
            assumedBy: new iam.FederatedPrincipal(
                "cognito-identity.amazonaws.com",
                {
                    StringEquals: {
                        "cognito-identity.amazonaws.com:aud": idPool.ref,
                    },
                    "ForAnyValue:StringLike": {
                        "cognito-identity.amazonaws.com:amr": "unauthenticated",
                    },
                },
                "sts:AssumeRoleWithWebIdentity"
            )
        });

        new cognito.CfnIdentityPoolRoleAttachment(
            this,
            "identity-pool-role-attachment",
            {
                identityPoolId: idPool.ref,
                roles: {
                    authenticated: cognitoUserRole.roleArn,
                    unauthenticated: anonCognitoUserRole.roleArn,

                },
            }
        );

        params?.setParam(cognitoUserPoolIdParam,userPool.userPoolId);
        params?.setParam(cognitoUserPoolClientIdParam,userPoolClient.userPoolClientId);
        params?.setParam(cognitoIdentityPoolIdParam,idPool.ref);


        this.userPool=userPool;
        this.userPoolClient=userPoolClient;
        this.idPool=idPool;
        this.cognitoUserRole=cognitoUserRole;
        this.anonCognitoUserRole=anonCognitoUserRole;

        if(authorizedAccessRequests){
            for(const r of authorizedAccessRequests){
                this.accessRequests.push({
                    ...r,
                    grantee:cognitoUserRole
                })
            }
        }

        if(unauthorizedAccessRequests){
            for(const r of unauthorizedAccessRequests){
                this.accessRequests.push({
                    ...r,
                    grantee:anonCognitoUserRole
                })
            }
        }


        if(name && grantAccess){
            this.accessGrants.push({
                grantName:name,
                grant:request=>{
                    if(request.types?.includes('auth')){
                        userPool.grant(request.grantee,'cognito-idp:*');
                    }
                }
            })
        }

        accessManager?.addGroup(this);
    }

}
