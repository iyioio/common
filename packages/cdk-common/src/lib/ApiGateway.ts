import { HttpMethod, ParamTypeDef, allHttpMethods } from "@iyio/common";
import { Duration } from "aws-cdk-lib";
import * as ag from "aws-cdk-lib/aws-apigateway";
import * as cm from "aws-cdk-lib/aws-certificatemanager";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as sns from "aws-cdk-lib/aws-sns";
import { Construct } from "constructs";
import { ManagedProps, getDefaultManagedProps } from "./ManagedProps.js";
import { ApiRoute, ApiRouteTarget, IApiRouter } from "./cdk-types.js";

export interface DomainNameOptionsWithOptionalCert extends Omit<ag.DomainNameOptions,'certificate'>
{
    certificate?:cm.ICertificate
}

export interface ApiGatewayProps
{
    cors?:boolean;
    routes?:ApiRoute[];
    managed?:ManagedProps;
    accountId:string;
    region:string;
    domainNames?:(string|DomainNameOptionsWithOptionalCert)[];
    urlParam?:ParamTypeDef<string>;
    domainParam?:ParamTypeDef<string>;
    defaultDomainParam?:ParamTypeDef<string>;
    stageName?:string;
}

export class ApiGateway extends Construct implements IApiRouter
{

    public readonly api:ag.RestApi;

    private readonly routes:ApiRoute[];

    private readonly accountId:string;
    private readonly region:string;

    public readonly domainName:string;
    public readonly defaultDomainName:string;
    public readonly url:string;

    private readonly managed:ManagedProps;


    public readonly domainNames:ag.DomainName[]=[];

    public constructor(scope:Construct,name:string,{
        cors,
        routes=[],
        accountId,
        region,
        domainNames,
        urlParam,
        domainParam,
        defaultDomainParam,
        stageName='api',
        managed=getDefaultManagedProps()
    }:ApiGatewayProps){

        super(scope,name);

        this.managed=managed;

        const {
            resources,
            params,
        }=managed;

        this.routes=routes;
        this.accountId=accountId;
        this.region=region;

        this.api=new ag.RestApi(this,"Api",{
            deployOptions:{
                stageName,
            },
            binaryMediaTypes:["*/*"],
            defaultCorsPreflightOptions:cors?{
                allowOrigins:ag.Cors.ALL_ORIGINS,
                allowMethods:ag.Cors.ALL_METHODS,
                allowHeaders:["*"],
                allowCredentials:true,
                maxAge:Duration.days(1),
            }:undefined,

        });
        let domainName:string|undefined;
        let customDomain=false;
        if(domainNames?.length){

            const stringNames=domainNames.map(d=>typeof d==='string'?d:d.domainName);
            const first=stringNames[0];
            if(!first){
                throw new Error('Api domainNames contains an empty value');
            }

            stringNames.shift();

            let _certificate:cm.Certificate|null=null;
            const getCert=()=>{
                return _certificate??(_certificate=new cm.Certificate(this, `Cert`, {
                    domainName:first,
                    validation:cm.CertificateValidation.fromDns(),
                    subjectAlternativeNames:stringNames.length?stringNames:undefined,
                }))
            }

            for(let i=0;i<domainNames.length;i++){
                const name=domainNames[i];
                if(!name){continue}
                if(typeof name === 'string'){
                    this.domainNames.push(this.api.addDomainName(`Domain${i}`,{
                        domainName:name,
                        certificate:getCert()
                    }));
                    if(!domainName){
                        domainName=name;
                        customDomain=true;
                    }
                }else{
                    this.domainNames.push(this.api.addDomainName(`Domain${i}`,{
                        ...name,
                        certificate:name.certificate??getCert()
                    }));
                    if(!domainName){
                        domainName=name.domainName;
                        customDomain=true;
                    }
                }
            }
        }
        this.defaultDomainName=`${this.api.restApiId}.execute-api.${region}.amazonaws.com`
        if(!domainName){
            domainName=this.defaultDomainName;
        }
        this.domainName=domainName;
        this.url=customDomain?`https://${domainName}/`:`https://${this.defaultDomainName}/${stageName}/`

        for(const route of routes){
            if(route.target){
                this.addApiTarget(route,route.target);
            }
        }

        if(params){
            if(urlParam){
                params.setParam(urlParam,this.url);
            }
            if(domainParam){
                params.setParam(domainParam,this.domainName);
            }
            if(defaultDomainParam){
                params.setParam(defaultDomainParam,this.defaultDomainName);
            }
        }

        resources.push({name,api:this});

    }

    public addApiTarget(route:ApiRoute,target:ApiRouteTarget){
        if(target.topic){
            this.addSnsTarget(route,target.topic);
        }
        if(target.fn){
            this.addFnTarget(route,target.fn,{proxy:true});
        }
    }

    public createResource(route:ApiRoute):ag.Resource
    {
        let path=route.path;
        if(path.startsWith('/')){
            path=path.substring(1);
        }
        return this.api.root.addResource(path);
    }

    private getMethodOptions(method:HttpMethod,route:ApiRoute):Partial<ag.MethodOptions>{
        const auth=route.auth?.find(a=>a.method===method)??route.auth?.find(a=>a.method===undefined);
        if(!auth){
            return {}
        }

        let userPool=auth.userPool;

        if(!userPool && this.managed && auth.managedName){
            userPool=this.managed.userPools.find(p=>p.managedName===auth.managedName);
        }

        if(userPool){
            return {
                authorizationType:ag.AuthorizationType.COGNITO,
                authorizer:new ag.CognitoUserPoolsAuthorizer(this,route.path+'Auth'+method,{
                    cognitoUserPools:[userPool.userPool]
                }),
            }
        }

        return {};

    }

    public addMatchingTargets(targets:ApiRouteTarget[]):void{
        for(const t of targets){
            const route=this.routes.find(r=>
                t.targetName &&
                !r.target &&
                r.targetName &&
                r.targetName===t.targetName
            );
            if(route){
                this.addApiTarget(route,t);
            }
        }
    }

    public addFnTarget(route:ApiRoute,target:lambda.Function,targetOptions?:ag.LambdaIntegrationOptions){

        const resource=this.createResource(route);

        for(const method of allHttpMethods){
            if( (!route.methods && method!=='OPTIONS') ||
                route.methods?.includes(method)
            ){
                resource.addMethod(
                    method,
                    new ag.LambdaIntegration(target,{
                        proxy:true,
                        ...route.fnTargetOptions,
                        ...targetOptions
                    }),
                    this.getMethodOptions(method,route)
                );
            }
        }
    }

    public addSnsTarget(route:ApiRoute,topic:sns.Topic){

        const resource=this.createResource(route);

        const gatewayExecutionRole: any = new iam.Role(
            this,
            "GatewayExecutionRole",
            {
                assumedBy: new iam.ServicePrincipal("apigateway.amazonaws.com"),
                inlinePolicies: {
                    PublishMessagePolicy: new iam.PolicyDocument({
                        statements: [
                            new iam.PolicyStatement({
                                actions: ["sns:Publish"],
                                resources: [topic.topicArn],
                            }),
                        ],
                    }),
                },
            }
        );

        resource.addMethod(
            "POST",
            new ag.AwsIntegration({
                service: "sns",
                integrationHttpMethod: "POST",
                path: `${this.accountId}/${topic.topicName}`,
                options: {
                    credentialsRole: gatewayExecutionRole,
                    passthroughBehavior: ag.PassthroughBehavior.NEVER,
                    requestParameters: {
                        "integration.request.header.Content-Type": `'application/x-www-form-urlencoded'`,
                    },
                    requestTemplates: {
                        "application/json": `Action=Publish&TopicArn=$util.urlEncode('${topic.topicArn}')&Message=$util.urlEncode($input.body)`,
                    },
                    integrationResponses: [
                        {
                            statusCode: "200",
                            responseParameters: {
                                "method.response.header.Access-Control-Allow-Origin":
                                    "'*'",
                            },
                            responseTemplates: {
                                "application/json": `{"status": "message added to topic"}`,
                            },
                        },
                        {
                            statusCode: "400",
                            selectionPattern: "^[Error].*",
                            responseParameters: {
                                "method.response.header.Access-Control-Allow-Origin":
                                    "'*'",
                            },
                            responseTemplates: {
                                "application/json": `{"state":"error","message":"$util.escapeJavaScript($input.path('$.errorMessage'))"}`,
                            },
                        },
                    ],
                },
            }),
            {
                ...this.getMethodOptions('POST',route),
                methodResponses: [
                    {
                        statusCode: "200",
                        responseParameters: {
                            "method.response.header.Content-Type": true,
                            "method.response.header.Access-Control-Allow-Origin":
                                true,
                            "method.response.header.Access-Control-Allow-Credentials":
                                true,
                        },
                    },
                    {
                        statusCode: "400",
                        responseParameters: {
                            "method.response.header.Content-Type": true,
                            "method.response.header.Access-Control-Allow-Origin":
                                true,
                            "method.response.header.Access-Control-Allow-Credentials":
                                true,
                        },
                    },
                ],
            }
        );
    }
}
