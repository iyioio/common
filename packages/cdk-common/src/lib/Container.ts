import { ParamTypeDef } from '@iyio/common';
import { Duration } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecra from 'aws-cdk-lib/aws-ecr-assets';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from "constructs";
import { ManagedProps, getDefaultManagedProps } from "./ManagedProps";
import { getDefaultVpc } from './cdk-lib';
import { AccessGranter, AccessRequest, AccessRequestDescription, EnvVarTarget, IAccessGrantGroup, IAccessRequestGroup, IPassiveAccessTargetGroup, PassiveAccessGrantDescription, PassiveAccessTarget } from './cdk-types';
import { requireDefaultCluster } from './cluster-lib';

export interface ContainerProps
{
    path:string;
    managed?:ManagedProps;
    vCpuCount?:number;
    memoryMb?:number;
    cpuArchitecture?:'x86_64'|'arm64';
    env?:Record<string,string>;
    vpc?:ec2.IVpc;
    port?:number;
    enableExecuteCommand?:boolean;

    /**
     * Http path to use for health checks. If not supplied health checks are disabled
     */
    healthCheckPath?:string;

    healthCheckCmd?:string;

    /**
     * @default 30
     */
    healthCheckIntervalSeconds?:number;


    /**
     * @default 5
     */
    healthCheckRetries?:number;

    /**
     * @default 30
     */
    healthCheckTimeoutSeconds?:number;

    /**
     * @default 30
     */
    healthCheckStartSeconds?:number;

    cluster?:ecs.Cluster;

    enableScaling?:boolean;

    /**
     * When scaling is disabled this will set the number of instances of the container to create.
     * When scaling is enabled this will be the min number of instances to scale down to.
     * @default 1
     */
    minInstanceCount?:number;

    /**
     * Only used when enableScaling is true. Sets the max number of instances to scale up to.
     * @default 5
     */
    maxInstanceCount?:number;

    /**
     * Only used when enableScaling is true. Controls scaling based on cpu usages and is a
     * value of 0 to 1.
     * @default 0.75
     */
    targetCpuUsage?:number;

    /**
     * The number of seconds before scaling up.
     * @efault 30
     */
    scaleUpSeconds?:number;

    /**
     * The number of seconds before scaling down.
     * @efault 60
     */
    scaleDownSeconds?:number;

    taskArnParam?:ParamTypeDef<string>;
    serviceArnParam?:ParamTypeDef<string>;
    grantName?:string;
    grantAccess?:boolean;
    accessRequests?:AccessRequestDescription[];
    grantAccessRequests?:PassiveAccessGrantDescription[];
    noPassiveAccess?:boolean;
}

export class Container extends Construct implements IAccessGrantGroup, IAccessRequestGroup, IPassiveAccessTargetGroup
{

    public readonly task:ecs.FargateTaskDefinition;
    public readonly container:ecs.ContainerDefinition;
    public readonly service:ecs.FargateService;
    //public readonly loadBalancer:ecsp.ApplicationLoadBalancedFargateService;

    public readonly accessGrants:AccessGranter[]=[];

    public readonly accessRequests:AccessRequest[]=[];

    public passiveTargets:PassiveAccessTarget[]=[];

    public constructor(scope:Construct, name:string, {
        path,
        vCpuCount=256,
        memoryMb=2048,
        cpuArchitecture='x86_64',
        vpc,
        enableExecuteCommand,
        enableScaling=false,
        minInstanceCount=1,
        maxInstanceCount=5,
        targetCpuUsage=0.75,
        scaleDownSeconds=60,
        scaleUpSeconds=30,
        env,
        healthCheckPath,
        healthCheckCmd,
        healthCheckIntervalSeconds=30,
        healthCheckRetries=5,
        healthCheckTimeoutSeconds=30,
        healthCheckStartSeconds=30,
        port=8080,
        serviceArnParam,
        taskArnParam,
        grantAccess,
        grantAccessRequests,
        accessRequests,
        noPassiveAccess,
        grantName,
        cluster=requireDefaultCluster(),
        managed:{
            params,
            accessManager,
            apiRouteTargets,
        }=getDefaultManagedProps()
    }:ContainerProps)
    {
        super(scope,name);

        if(!vpc){
            vpc=getDefaultVpc(this);
        }

        const cpuType=cpuArchitecture==='x86_64'?ecs.CpuArchitecture.X86_64:ecs.CpuArchitecture.ARM64;
        const osType=ecs.OperatingSystemFamily.LINUX;

        const task=new ecs.FargateTaskDefinition(this,`Task`,{
            cpu:vCpuCount,
            memoryLimitMiB:memoryMb,
            runtimePlatform:{
                cpuArchitecture:cpuType,
                operatingSystemFamily:osType
            },
        });
        task.env
        this.task=task;


        const container=task.addContainer(`Container`,{
            image:ecs.ContainerImage.fromAsset(path,{
                platform:cpuArchitecture==='x86_64'?ecra.Platform.LINUX_AMD64:ecra.Platform.LINUX_ARM64,
            }),
            environment:env,
            logging:new ecs.AwsLogDriver({
                streamPrefix:`${name}FargateTask`,
                logRetention:7
            }),
            healthCheck:{
                command:healthCheckCmd?
                    ["CMD-SHELL",healthCheckCmd]
                :healthCheckPath?
                    ["CMD-SHELL",`curl -f http://localhost:${port}/ || exit 1`]
                :
                    ["CMD-SHELL",'exit 0']
                ,
                interval:Duration.seconds(healthCheckIntervalSeconds),
                retries:healthCheckRetries,
                timeout:Duration.seconds(healthCheckTimeoutSeconds),
                startPeriod:Duration.seconds(healthCheckStartSeconds),
            }

        });
        this.container=container;
        container.addPortMappings({
            containerPort:port,
        })

        const service=new ecs.FargateService(this,"FargateService",{
            cluster,
            taskDefinition:task,
            desiredCount:minInstanceCount,
            enableExecuteCommand,
        });
        this.service=service;

        service.taskDefinition.executionRole?.addManagedPolicy(
            iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryPowerUser')
        );

        if(enableScaling){
            const scaling=service.autoScaleTaskCount({
                minCapacity:minInstanceCount,
                maxCapacity:maxInstanceCount
            })
            scaling.scaleOnCpuUtilization('CpuScaling',{
                targetUtilizationPercent:100*targetCpuUsage,
                scaleInCooldown:Duration.seconds(scaleDownSeconds),
                scaleOutCooldown:Duration.seconds(scaleUpSeconds),
            })
        }




        let varContainer:EnvVarTarget|undefined=undefined;

        if(params){
            const excludeParams:ParamTypeDef<string>[]=[];
            if(taskArnParam){
                params.setParam(taskArnParam,task.taskDefinitionArn,'fn');
                excludeParams.push(taskArnParam);
            }
            if(serviceArnParam){
                params.setParam(serviceArnParam,service.serviceArn,'fn');
                excludeParams.push(serviceArnParam);
            }
            varContainer={
                name:name,
                varContainer:container,
                excludeParams,
                requiredParams:[],
            }
            params.addVarContainer(varContainer)
        }

        if(grantAccess){
            this.accessGrants.push({
                grantName:grantName??name,
                passiveGrants:grantAccessRequests,
                grant:request=>{
                    if(request.types?.includes('invoke')){
                        task.grantRun(request.grantee);
                        if(request.varContainer){
                            if(taskArnParam){
                                request.varContainer.requiredParams.push(taskArnParam);
                            }
                            if(serviceArnParam){
                                request.varContainer.requiredParams.push(serviceArnParam);
                            }
                        }
                    }
                }
            })
        }

        if(accessRequests){
            this.accessRequests.push(...accessRequests.map(i=>({
                ...i,
                varContainer,
                grantee:task.taskRole
            })));
        }

        if(!noPassiveAccess){
            this.passiveTargets.push({
                isFn:true,
                targetName:name,
                grantee:task.taskRole,
                varContainer
            })
        }

        apiRouteTargets.push({targetName:name,elbTarget:{
            port:port,
            target:service
        }})

        accessManager?.addGroup(this);

    }
}
