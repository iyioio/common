import { AccessRequestDescription, ParamTypeDef, PassiveAccessGrantDescription } from '@iyio/common';
import { Duration, IgnoreMode } from 'aws-cdk-lib';
import * as autoScaling from "aws-cdk-lib/aws-applicationautoscaling";
import * as autoScalingBase from "aws-cdk-lib/aws-autoscaling";
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecra from 'aws-cdk-lib/aws-ecr-assets';
import * as ecsAssets from 'aws-cdk-lib/aws-ecr-assets';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sqs from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";
import { ManagedProps, getDefaultManagedProps } from "./ManagedProps";
import { getDefaultVpc } from './cdk-lib';
import { AccessGranter, AccessRequest, EnvVarTarget, IAccessGrantGroup, IAccessRequestGroup, IPassiveAccessTargetGroup, PassiveAccessTarget } from './cdk-types';
import { requireDefaultCluster } from './cluster-lib';
import { defaultContainerIgnoreOverrides, getCdkContainerIgnorePaths } from './getCdkContainerIgnorePaths';

export interface ContainerProps
{
    dir:string;
    /**
     * Path to Dockerfile relative to dir
     */
    file?:string;
    managed?:ManagedProps;
    vCpuCount?:number;
    memoryMb?:number;
    cpuArchitecture?:'x86_64'|'arm64';
    env?:Record<string,string>;
    vpc?:ec2.IVpc;
    port?:number;
    enableExecuteCommand?:boolean;

    /**
     * Http path to use for health checks by application load balancers
     * @default '/health-check'
     */
    healthCheckPath?:string|null;

    healthCheckCmd?:string;

    /**
     * @default 30
     */
    healthCheckIntervalSeconds?:number;

    /**
     * @default 2
     */
    healthyThresholdCount?:number;


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

    /**
     * The value for the size (in MiB) of the /dev/shm volume. This parameter maps to the --shm-size option to docker run
     */
    sharedMemorySizeMb?:number;

    taskArnParam?:ParamTypeDef<string>;
    serviceArnParam?:ParamTypeDef<string>;
    grantName?:string;
    grantAccess?:boolean;
    accessRequests?:AccessRequestDescription[];
    grantAccessRequests?:PassiveAccessGrantDescription[];
    noPassiveAccess?:boolean;
    ec2Type?:string;
    privileged?:boolean;

    /**
     * A command that can be used to override the default command of the container image
     */
    cmd?:string[];

    /**
     * An array of directory names that will be ignored in addition to paths ignored by
     * the docker ignore file of the container
     */
    ignoreOverrides?:string[];
}

export class Container extends Construct implements IAccessGrantGroup, IAccessRequestGroup, IPassiveAccessTargetGroup
{

    public readonly task:ecs.FargateTaskDefinition;
    public readonly container:ecs.ContainerDefinition;
    public readonly service:ecs.FargateService;
    public readonly scaling:ecs.ScalableTaskCount|undefined;
    //public readonly loadBalancer:ecsp.ApplicationLoadBalancedFargateService;

    public readonly accessGrants:AccessGranter[]=[];

    public readonly accessRequests:AccessRequest[]=[];

    public passiveTargets:PassiveAccessTarget[]=[];

    public constructor(scope:Construct, name:string, {
        dir,
        file='Dockerfile',
        vCpuCount=256,
        memoryMb=2048,
        sharedMemorySizeMb,
        cpuArchitecture='x86_64',
        vpc,
        cmd,
        ec2Type,
        privileged,
        enableExecuteCommand,
        enableScaling=false,
        minInstanceCount=1,
        maxInstanceCount=5,
        targetCpuUsage=0.75,
        scaleDownSeconds=60,
        scaleUpSeconds=30,
        env,
        healthCheckPath='/health-check',
        healthCheckCmd,
        healthCheckIntervalSeconds=30,
        healthyThresholdCount=2,
        healthCheckRetries=5,
        healthCheckTimeoutSeconds=15,
        healthCheckStartSeconds=0,
        port=8080,
        serviceArnParam,
        taskArnParam,
        grantAccess,
        grantAccessRequests,
        accessRequests,
        noPassiveAccess,
        grantName,
        cluster=requireDefaultCluster(),
        ignoreOverrides=defaultContainerIgnoreOverrides,
        managed:{
            params,
            accessManager,
            apiRouteTargets,
            resources,
        }=getDefaultManagedProps()
    }:ContainerProps)
    {
        super(scope,name);

        if(!vpc){
            vpc=getDefaultVpc(this);
        }

        const cpuType=cpuArchitecture==='x86_64'?ecs.CpuArchitecture.X86_64:ecs.CpuArchitecture.ARM64;
        const osType=ecs.OperatingSystemFamily.LINUX;

        const task=ec2Type?new ecs.Ec2TaskDefinition(this,'Ec2Task',{

        }):new ecs.FargateTaskDefinition(this,`Task`,{
            cpu:vCpuCount,
            memoryLimitMiB:memoryMb,
            runtimePlatform:{
                cpuArchitecture:cpuType,
                operatingSystemFamily:osType
            },
        });
        task.env
        this.task=task;

        const ignorePaths=getCdkContainerIgnorePaths(file,dir,ignoreOverrides);

        const dockerAsset=new ecsAssets.DockerImageAsset(this,'DockerImage',{
            directory:dir,
            file,
            platform:cpuArchitecture==='x86_64'?ecra.Platform.LINUX_AMD64:ecra.Platform.LINUX_ARM64,
            exclude:ignorePaths,
            ignoreMode:IgnoreMode.DOCKER,
        })

        const container=task.addContainer(`Container`,{
            image: ecs.ContainerImage.fromDockerImageAsset(dockerAsset),
            environment:{
                TASK_INFO_MIN_INSTANCE_COUNT:minInstanceCount.toString(),
                TASK_INFO_MAX_INSTANCE_COUNT:maxInstanceCount.toString(),
                TASK_INFO_TARGET_CPU_USAGE:targetCpuUsage.toString(),
                ...env
            },
            logging:new ecs.AwsLogDriver({
                streamPrefix:`${name}FargateTask`,
                logRetention:7
            }),
            healthCheck:{
                command:healthCheckCmd?
                    ["CMD-SHELL",healthCheckCmd]
                :
                    ["CMD-SHELL",'echo ok']
                ,
                interval:Duration.seconds(healthCheckIntervalSeconds),
                retries:healthCheckRetries,
                timeout:Duration.seconds(healthCheckTimeoutSeconds),
                startPeriod:Duration.seconds(healthCheckStartSeconds),
            },
            command:cmd,

            // ec2 mode
            privileged,
            linuxParameters:sharedMemorySizeMb===undefined?undefined:new ecs.LinuxParameters(this,'LP',{
                sharedMemorySize:sharedMemorySizeMb,
            }),
            memoryLimitMiB:ec2Type?memoryMb:undefined,

        });
        this.container=container;
        container.addPortMappings({
            containerPort:port,
        })

        const service=ec2Type?new ecs.Ec2Service(this,"Ec2Service",{
            cluster,
            taskDefinition:task,
            desiredCount:minInstanceCount,
            enableExecuteCommand,
        }):new ecs.FargateService(this,"FargateService",{
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
            this.scaling=scaling;
        }
        if(ec2Type){
            const asg=new autoScalingBase.AutoScalingGroup(this,'AutoScalingGroup',{
                vpc,
                instanceType:new ec2.InstanceType(ec2Type),
                machineImage:ecs.EcsOptimizedImage.amazonLinux2(cpuArchitecture==='x86_64'?ecs.AmiHardwareType.STANDARD:ecs.AmiHardwareType.ARM),
                minCapacity:minInstanceCount,
                maxCapacity:maxInstanceCount
            });
            const cp=new ecs.AsgCapacityProvider(this,'CapacityProvider',{
                autoScalingGroup:asg
            })
            cluster.addAsgCapacityProvider(cp);
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
            target:service,
            getHealthCheck:()=>({
                port:String(port),
                interval:Duration.seconds(healthCheckIntervalSeconds),
                retries:healthCheckRetries,
                timeout:Duration.seconds(healthCheckTimeoutSeconds),
                startPeriod:Duration.seconds(healthCheckStartSeconds),
                healthyThresholdCount,
                healthyHttpCodes:'200-399',
                path:healthCheckPath?(healthCheckPath.startsWith('/')?healthCheckPath:'/'+healthCheckPath):'/'
            })
        }})

        resources.push({name,container:this});

        accessManager?.addGroup(this);

    }

    public connectQueue(queueName:string,queue:sqs.Queue){
        queue.grantConsumeMessages(this.task.taskRole);

        this.container.addEnvironment('CONNECTED_QUEUE_URL',queue.queueUrl);

        if(this.scaling){
            this.scaling.scaleOnMetric(`OnMsgVis-${queueName}`,{
                metric:queue.metricApproximateNumberOfMessagesVisible(),
                adjustmentType:autoScaling.AdjustmentType.CHANGE_IN_CAPACITY,
                cooldown:Duration.seconds(300),
                scalingSteps:[
                    {upper:0,change:-1},
                    {lower:1,change:+1},
                ]
            })
        }
    }
}

export interface CdkContainerPath
{
    stage?:string;
    path:string;
}

export interface CdkContainerOptions
{
    paths?:CdkContainerPath[];
    ignorePaths?:string[]
}
