import { cognitoIdentityPoolIdParam, cognitoUserPoolClientIdParam, cognitoUserPoolIdParam } from '@iyio/aws-credential-providers';
import * as cdk from 'aws-cdk-lib';
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as iam from "aws-cdk-lib/aws-iam";
import { ScopeWithParams } from './cdk-types';
// import * as ec2 from 'aws-cdk-lib/aws-ec2';
// import * as efs from 'aws-cdk-lib/aws-efs';
// import * as lambda from 'aws-cdk-lib/aws-lambda';
// import * as s3Deployment from 'aws-cdk-lib/aws-s3-deployment';
// import * as secrets from 'aws-cdk-lib/aws-secretsmanager';

export const createUserPool=(scope:ScopeWithParams)=>{


    // User Pool
    const userPool = new cognito.UserPool(scope, "UserPool", {
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
    });

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
        scope,
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
            ],
            readAttributes: clientReadAttributes,
            writeAttributes: clientWriteAttributes,
        }
    );


    const idPool = new cognito.CfnIdentityPool(scope, "IdentityPool", {
        allowUnauthenticatedIdentities: true,
        cognitoIdentityProviders: [{
            clientId:userPoolClient.userPoolClientId,
            providerName:userPool.userPoolProviderName
        }]
    });

    const cognitoUserRole = new iam.Role(scope, "cognitoUserRole", {
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

    const anonCognitoUserRole = new iam.Role(scope, "anonCognitoUserRole", {
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
        scope,
        "identity-pool-role-attachment",
        {
            identityPoolId: idPool.ref,
            roles: {
                authenticated: cognitoUserRole.roleArn,
                unauthenticated: anonCognitoUserRole.roleArn,

            },
        }
    );

    scope.params.setParam(cognitoUserPoolIdParam,userPool.userPoolId);
    scope.params.setParam(cognitoUserPoolClientIdParam,userPoolClient.userPoolClientId);
    scope.params.setParam(cognitoIdentityPoolIdParam,idPool.ref);

    return {
        userPool,
        userPoolClient,
        idPool,
        cognitoUserRole,
        anonCognitoUserRole,
    };
}
