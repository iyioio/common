import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayIntegrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { addPolicyToGrantee } from './cdk-lib.js';
import { Grantee } from './cdk-types.js';

export interface WebsocketApiProps {
    readonly name: string;
    readonly stageName: string;
    readonly connectFn?: lambda.IFunction;
    readonly disconnectFn?: lambda.IFunction;
    readonly defaultFn?: lambda.IFunction;
}

export class WebsocketApi extends Construct {
    public readonly props: WebsocketApiProps;
    public readonly api: apigateway.WebSocketApi;
    public readonly connectionUrl: string;
    public readonly endpoint: string;
    public readonly resourceBaseArn: string;

    constructor(scope: Construct, name: string, props: WebsocketApiProps) {

        super(scope, name);

        this.props = props;

        this.api = new apigateway.WebSocketApi(this, 'SocketApi', {
            apiName:props.name,
            connectRouteOptions:props.connectFn?{
                integration:new apigatewayIntegrations.WebSocketLambdaIntegration('WebSocketConnect',props.connectFn)
            }:undefined,
            disconnectRouteOptions:props.disconnectFn?{
                integration:new apigatewayIntegrations.WebSocketLambdaIntegration('WebSocketDisconnect',props.disconnectFn)
            }:undefined,
            defaultRouteOptions:props.defaultFn?{
                integration:new apigatewayIntegrations.WebSocketLambdaIntegration('WebSocketDefault',props.defaultFn)
            }:undefined
        });

        this.resourceBaseArn = `arn:aws:execute-api:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:${this.api.apiId}/${props.stageName}`;

        const stage=new apigateway.WebSocketStage(this,this.props.name+'Stage',{
            webSocketApi:this.api,
            stageName:props.stageName,
            autoDeploy:true,
        })
        this.connectionUrl = stage.url;
        this.endpoint=stage.callbackUrl;
    }

    public grantManageConnections(grantee: Grantee) {
        addPolicyToGrantee(
            grantee,
            () =>
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    resources: [`${this.resourceBaseArn}/*`],
                    actions: ['execute-api:ManageConnections'],
                })
        );
    }

    public grantConnect(grantee: Grantee) {
        addPolicyToGrantee(grantee, () => [
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                resources: [`${this.resourceBaseArn}/*/$connect`],
                actions: ['execute-api:Invoke'],
            }),
            new iam.PolicyStatement({
                effect: iam.Effect.DENY,
                resources: [`${this.resourceBaseArn}/*/secret`],
                actions: ['execute-api:Invoke'],
            }),
            new iam.PolicyStatement({
                effect: iam.Effect.DENY,
                resources: [`${this.resourceBaseArn}/*`],
                actions: ['execute-api:ManageConnections'],
            }),
        ]);
    }
}
