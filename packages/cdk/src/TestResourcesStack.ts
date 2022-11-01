import * as cdk from 'aws-cdk-lib';
// import * as ec2 from 'aws-cdk-lib/aws-ec2';
// import * as efs from 'aws-cdk-lib/aws-efs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
// import * as s3Deployment from 'aws-cdk-lib/aws-s3-deployment';
// import * as secrets from 'aws-cdk-lib/aws-secretsmanager';
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from 'constructs';

export class TestResourcesStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const {cognitoUserRole}=this.createUserPool();

        const bucket=new s3.Bucket(this,'TestBucket',{
            removalPolicy:cdk.RemovalPolicy.DESTROY
        });

        bucket.grantReadWrite(cognitoUserRole);
        new cdk.CfnOutput(this,'testBucketName',{value:bucket.bucketName});

    }

    createUserPool() {


        // 👇 User Pool
        const userPool = new cognito.UserPool(this, "userPool", {
            selfSignUpEnabled: true,
            signInAliases: {
                email: true,
            },
            autoVerify: {
                email: true,
            },
            passwordPolicy: {
                minLength: 6,
                requireLowercase: false,
                requireDigits: false,
                requireUppercase: false,
                requireSymbols: false,
            },
            accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            lambdaTriggers:{
                preSignUp:new lambda.Function(this, 'AutoVerifyUser', {
                    code: new lambda.InlineCode(`
                        exports.handler=function(event,context,callback){
                            event.response.autoConfirmUser=true;
                            event.response.autoVerifyEmail=true;
                            callback(null,event);
                        }
                    `),
                    handler: 'index.handler',
                    runtime: lambda.Runtime.NODEJS_14_X,
                })
            }
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
            .withStandardAttributes(standardCognitoAttributes);

        const clientWriteAttributes = new cognito.ClientAttributes()
            .withStandardAttributes({
                ...standardCognitoAttributes,
                emailVerified: false,
                phoneNumberVerified: false,
            });

        // 👇 User Pool Client
        const userPoolClient = new cognito.UserPoolClient(
            this,
            "userpoolClient",
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


        const idPool = new cognito.CfnIdentityPool(this, "identityPool", {
            allowUnauthenticatedIdentities: false,
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

        new cognito.CfnIdentityPoolRoleAttachment(
            this,
            "identity-pool-role-attachment",
            {
                identityPoolId: idPool.ref,
                roles: {
                    authenticated: cognitoUserRole.roleArn,
                },
            }
        );

        new cdk.CfnOutput(this,"cognitoUserPoolId",{value:userPool.userPoolId});
        new cdk.CfnOutput(this,"cognitoUserPoolClientId",{value:userPoolClient.userPoolClientId});
        new cdk.CfnOutput(this,"cognitoIdentityPoolId",{value:idPool.ref});

        return {
            userPool,
            userPoolClient,
            idPool,
            cognitoUserRole
        };
    }
}
