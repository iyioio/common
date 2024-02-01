import { ParamTypeDef, strHash } from "@iyio/common";
import * as cm from "aws-cdk-lib/aws-certificatemanager";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as elbv2Targets from "aws-cdk-lib/aws-elasticloadbalancingv2-targets";
import { Construct } from "constructs";
import { ManagedProps, getDefaultManagedProps } from "./ManagedProps";
import { getDefaultVpc } from "./cdk-lib";
import { ApiRoute, ApiRouteTarget, IApiRouter } from "./cdk-types";
import { CorsOptions, createCorsFn } from "./cors-fn";

export interface ApiProps
{

    isPublic?:boolean;
    disableHttpRedirect?:boolean;
    /**
     * If true cors will be enabled for all all origins. If a string or array of strings then
     * cors will be enabled for the specified domains.
     */
    cors?:boolean|string|string[]|CorsOptions;
    routes?:ApiRoute[];
    managed?:ManagedProps;
    domainNames?:string[];
    urlParam?:ParamTypeDef<string>;
    domainParam?:ParamTypeDef<string>;
    defaultDomainParam?:ParamTypeDef<string>;

    vpc?:ec2.IVpc;
    loadBalancerProps?:Partial<elbv2.ApplicationLoadBalancerProps>;
    /**
     * The port to listener for traffic on.
     * @default 443
     */
    port?:number;
    listenerProps?:Partial<elbv2.BaseApplicationListenerProps>;

    defaultMessage?:string;
}

export class Api extends Construct implements IApiRouter
{
    public readonly loadBalancer:elbv2.ApplicationLoadBalancer;
    public readonly listener:elbv2.ApplicationListener;

    private readonly routes:ApiRoute[];

    public readonly domainName:string;
    public readonly defaultDomainName:string;
    public readonly url:string;

    private readonly managed:ManagedProps;

    public readonly vpc:ec2.IVpc;


    public readonly domainNames:string[];

    private baseName:string;

    public constructor(scope:Construct,name:string,{

        isPublic=false,
        vpc,
        loadBalancerProps,
        cors,
        port=443,
        disableHttpRedirect,
        listenerProps,
        routes=[],
        domainNames,
        urlParam,
        domainParam,
        defaultDomainParam,
        managed=getDefaultManagedProps(),
        defaultMessage='OK'
    }:ApiProps){

        super(scope,name);

        this.baseName=isPublic?'Pub':'Pri';

        if(!vpc){
            vpc=getDefaultVpc(this);
        }
        this.vpc=vpc;

        if(typeof cors === 'string'){
            cors={
                origins:[cors]
            }
        }else if(Array.isArray(cors)){
            cors={
                origins:cors
            }
        }else if(cors===true){
            cors={}
        }

        this.managed=managed;

        const {
            apiRouters,
            params,
        }=managed;

        this.routes=routes;

        const lb=new elbv2.ApplicationLoadBalancer(this,`${this.baseName}LoadBalancer`,{
            vpc,
            internetFacing:isPublic,
            dropInvalidHeaderFields:false,
            ...loadBalancerProps
        });
        this.loadBalancer=lb;

        if(!disableHttpRedirect){
            lb.addListener(`${this.baseName}HttpToHttps`,{
                protocol:elbv2.ApplicationProtocol.HTTP,
                port:80,
                open:isPublic,
                defaultAction:elbv2.ListenerAction.redirect({
                    port:port?.toString()??'443',
                    protocol:elbv2.ApplicationProtocol.HTTPS,
                    permanent:true,
                }),
            });
        }

        const listener=lb.addListener(`${this.baseName}Listener`,{
            port,
            open:isPublic,
            ...listenerProps,
        })
        this.listener=listener;

        let domainName:string|undefined;
        if(domainNames?.length){

            domainName=domainNames[0];
            if(!domainName){
                throw new Error('Api domainNames contains an empty value');
            }

            const additional=[...domainNames];
            additional.shift();
            const cert=new cm.Certificate(this,`${this.baseName}Cert`,{
                domainName,
                validation:cm.CertificateValidation.fromDns(),
                subjectAlternativeNames:additional.length?additional:undefined,
            });
            listener.addCertificates(`${this.baseName}Cert`,[cert]);
        }
        this.defaultDomainName=lb.loadBalancerDnsName;
        if(!domainName){
            domainName=this.defaultDomainName;
        }
        this.domainNames=domainNames?[...domainNames,this.defaultDomainName]:[this.defaultDomainName];
        this.domainName=domainName;
        this.url=`https://${domainName}/`;


        if(cors){
            this.listener.addTargets(`${this.baseName}CorsTarget`,{
                priority:this.getPriority('CORS'),
                conditions:[
                    elbv2.ListenerCondition.httpRequestMethods(['OPTIONS'])
                ],
                targets:[new elbv2Targets.LambdaTarget(createCorsFn(this,'CorsFn',cors))]
            })
        }

        this.listener.addAction(`${this.baseName}Default`,{
            action:elbv2.ListenerAction.fixedResponse(200,{
                contentType:"text/plain",
                messageBody:defaultMessage,
            })
        })


        for(const route of routes){
            if(route.target){
                this.addApiTarget(route,route.target);
            }
        }

        apiRouters.push(this);

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

    }

    public addApiTarget(route:ApiRoute,target:ApiRouteTarget){
        let lbTarget:elbv2.IApplicationLoadBalancerTarget|undefined;
        let port:number|undefined;
        let vpc:ec2.IVpc|undefined;
        let protocol:elbv2.ApplicationProtocol|undefined;
        if(target.elbTarget){
            lbTarget=target.elbTarget.target;
            port=target.elbTarget.port;
            vpc=target.elbTarget.vpc??this.vpc;
            protocol=elbv2.ApplicationProtocol.HTTP;
        }else if(target.fn){
            lbTarget=new elbv2Targets.LambdaTarget(target.fn);
        }else if(target.topic){
            //todo - create a lambda function to sends the message
        }

        if(!lbTarget){
            throw new Error('Unable to create load balancer from ApiRouteTarget')
        }

        const targetGroup=new elbv2.ApplicationTargetGroup(this,`${this.baseName}Group${route.path}`,{
            vpc,
            port,
            protocol,
            targets:[lbTarget],
        })

        const conditions:elbv2.ListenerCondition[]=[
            elbv2.ListenerCondition.hostHeaders(this.domainNames),
            elbv2.ListenerCondition.pathPatterns([route.path.startsWith('/')?route.path:'/'+route.path]),
        ];
        if(route.methods){
            conditions.push(elbv2.ListenerCondition.httpRequestMethods(route.methods));
        }
        if(route.queryStrings){
            conditions.push(elbv2.ListenerCondition.queryStrings(route.queryStrings));
        }
        if(route.sourceIps){
            conditions.push(elbv2.ListenerCondition.sourceIps(route.sourceIps));
        }

        // todo - implement auth using a lambda callback
        // import * as elbv2Actions from "aws-cdk-lib/aws-elasticloadbalancingv2-actions";
        // if(route.auth){

        //     const up=(
        //         route.auth.find(u=>u.userPool)?.userPool??
        //         this.managed.userPools.find(u=>route.auth?.some(a=>a.managedName && a.managedName===u.managedName))
        //     );
        //     if(!up){
        //         throw new Error('Only Cognito auth supported at this time')
        //     }

        //     const next:elbv2.ListenerAction=elbv2.ListenerAction.forward([targetGroup])

        //     this.listener.addAction(route.path,{
        //         priority:this.getPriority(route.path),
        //         conditions,
        //         action:new elbv2Actions.AuthenticateCognitoAction({
        //             userPool:up.userPool,
        //             userPoolClient:up.userPoolClient,
        //             userPoolDomain:up.userPoolDomain,
        //             next
        //         })
        //     })
        // }else{
            this.listener.addTargetGroups(route.path,{
                priority:this.getPriority(route.path),
                targetGroups:[targetGroup],
                conditions
            })
        //}
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

    private priorities:number[]=[];
    private getPriority(name:string):number{
        let p=Math.round(strHash(name)/4294967296*maxPriority);
        if(p<0){
            p*=-1;
        }
        while(p>maxPriority){
            p=Math.round(p*0.1);
        }
        if(p<minPriority){
            p+=minPriority;
        }
        while(this.priorities.includes(p)){
            p++;
            if(p<0){
                p=minPriority;
            }
            while(p>maxPriority){
                p=Math.round(p*0.1);
            }
            if(p<minPriority){
                p+=minPriority;
            }
        }
        return p;
    }


}

const minPriority=1000;
const maxPriority=50000;
