import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as targets from "aws-cdk-lib/aws-elasticloadbalancingv2-targets";
import * as ga from "aws-cdk-lib/aws-globalaccelerator";
import * as gaEndpoints from "aws-cdk-lib/aws-globalaccelerator-endpoints";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";

export interface DomainRedirect
{
    fromDomain:string;
    toDomain:string;
}

export interface RedirectApiProps
{
    redirects:DomainRedirect[];
    fallbackSubdomain?:string;
    fallbackDomain?:string;
    fallbackSourceDomain?:string;
    vpc?:ec2.IVpc
}

export class RedirectApi extends Construct
{
    public constructor(scope: Construct, name: string, props:RedirectApiProps){

        super(scope,name);

        const {
            redirects,
            vpc=ec2.Vpc.fromLookup(this,"DefaultVpc",{isDefault:true}),
        }=props;

        if(!redirects?.length){
            return;
        }

        const redirectFn=this.createRedirectFn(props);

        const lb=new elbv2.ApplicationLoadBalancer(this,'LoadBalancer',{
            vpc,
            internetFacing:true,
        });

        const accelerator=new ga.Accelerator(this,'Accelerator');
        const accListener=accelerator.addListener('AccListener',{
            portRanges:[
                {fromPort:80},
                {fromPort:443},
            ]
        })
        const endpoint=new gaEndpoints.ApplicationLoadBalancerEndpoint(lb,{
            preserveClientIp:true
        })
        accListener.addEndpointGroup('AccGroup',{
            endpoints:[
                endpoint
            ]
        })

        const added:string[]=[];
        const certificates:acm.Certificate[]=[];

        for(const r of redirects){

            const from=r.fromDomain.toLowerCase();
            if(added.includes(from)){
                continue;
            }
            added.push(from);

            const name=getDomainRedirectName(r);

            const cert=new acm.Certificate(this,`${name}Cert`,{
                domainName:r.fromDomain,
                validation:acm.CertificateValidation.fromDns(),
            });

            certificates.push(cert);


        }



        const listener=lb.addListener('http',{
            port:443,
            certificates,
        });

        listener.addTargets("Redirects",{
            targets:[new targets.LambdaTarget(redirectFn as any) as any],
            healthCheck:{
                enabled:false
            }
        })

        lb.addRedirect();



    }

    private createRedirectFn(props:RedirectApiProps){
        return new lambda.Function(this,'RedirectFn',{
            handler:'index.handler',
            runtime:lambda.Runtime.NODEJS_14_X,
            logRetention:logs.RetentionDays.ONE_DAY,
            code:new lambda.InlineCode(`
                var props=${JSON.stringify(props)};
                exports.handler=async function handler(event) {
                    var host=event.headers.host||props.fallbackSourceDomain;
                    if(!host){
                        throw new Error('Unable to determine source host')
                    }
                    host=host.toLowerCase();
                    var redirect=null;
                    for(var i=0;i<props.redirects.length;i++){
                        var r=props.redirects[i];
                        if(r.fromDomain===host){
                            redirect=r;
                            break;
                        }
                    }
                    if(!redirect){
                        redirect={
                            fromDomain:host,
                            toDomain:(
                                props.fallbackDomain?props.fallbackDomain:
                                props.fallbackSubdomain?props.fallbackSubdomain+'.'+host:
                                null
                            )
                        }
                    }
                    if(!redirect.toDomain){
                        throw new Error('Unable to determine destination host. host='+host);
                    }
                    var path='https://'+redirect.toDomain+event.path;
                    if(event.queryStringParameters){
                        var first=true;
                        for(var e in event.queryStringParameters){
                            var value=event.queryStringParameters[e];
                            path+=(first?'?':'&')+encodeURIComponent(e)+'='+encodeURIComponent(value);
                            first=false;
                        }
                    }
                    return {
                        statusCode:301,
                        statusDescription:'301 Moved Permanently',
                        isBase64Encoded:false,
                        headers:{
                            "Content-Type":"text/plain",
                            "Location":path
                        },
                        body:host+' moved to '+redirect.toDomain
                    }
                }`
            ),
        });
    }
}

const getDomainRedirectName=(redirect:DomainRedirect)=>{
    const name=redirect.fromDomain.toLowerCase().replace(/\./g,'Dot').replace(/\W/g,'Nw');
    return name.substring(0,1).toUpperCase()+name.substring(1);
}
