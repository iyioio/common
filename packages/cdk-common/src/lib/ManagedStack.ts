import { awsRegionParam } from '@iyio/aws';
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { AccessManager } from "./AccessManager";
import { BridgeEvent } from './BridgeEvent';
import { ManagedProps } from './ManagedProps';
import { ParamOutput, ParamOutputOptions } from "./ParamOutput";
import { setDefaultVpc, setTmpCdkDir } from './cdk-lib';
import { ApiRouteTarget, IEventTarget, IHasUserPool, NamedBucket, NamedFn, NamedQueue, NamedResource, SiteContentSource } from './cdk-types';
import { setDefaultClusterProps } from './cluster-lib';

export interface ManagedStackProps extends cdk.StackProps, ParamOutputOptions
{
    defaultVpc?:ec2.IVpc|((scope:ManagedStack)=>ec2.IVpc);
    disableFargateAutoScaling?:boolean;
    dedicatedVpc?:boolean;
    tmpDir?:string;

    /**
     * If set and bucketKey is not defined keySalt will be used to salt the random key that is generated.
     */
    lambdaConfigKeySalt?:string;
}

export class ManagedStack extends cdk.Stack
{

    protected readonly params;

    protected readonly accessManager:AccessManager;

    protected readonly siteContentSources:SiteContentSource[]=[];

    protected readonly fns:NamedFn[]=[];

    protected readonly buckets:NamedBucket[]=[];

    protected readonly queues:NamedQueue[]=[];

    protected readonly events:BridgeEvent[]=[];

    protected readonly eventTargets:IEventTarget[]=[];

    protected readonly apiRouteTargets:ApiRouteTarget[]=[];

    protected readonly userPools:IHasUserPool[]=[];

    protected readonly resources:NamedResource[]=[];

    protected readonly beforeOutputs:((managed:ManagedProps)=>void)[]=[];

    public readonly managed:ManagedProps;

    public constructor(scope:Construct, id:string, {
        defaultVpc,
        disableFargateAutoScaling,
        dedicatedVpc,
        tmpDir,
        enableLambdaConfigLayer,
        excludeFnsFromConfigLayer,
        lambdaConfigKeySalt,
        ...props
    }:ManagedStackProps={}){
        super(scope,id,props);

        this.params=new ParamOutput({enableLambdaConfigLayer,excludeFnsFromConfigLayer,lambdaConfigKeySalt});

        if(tmpDir){
            setTmpCdkDir(tmpDir);
        }

        if(defaultVpc){
            setDefaultVpc((typeof defaultVpc === 'function')?defaultVpc(this):defaultVpc);
        }else if(dedicatedVpc){
            setDefaultVpc(new ec2.Vpc(this,'DefaultVpc',{}))
        }

        setDefaultClusterProps({
            scope:this,
            name:'Cluster',
            fargateAutoScaling:!disableFargateAutoScaling,
        })

        this.accessManager=new AccessManager(this.account,this.region);

        this.params.setParam(awsRegionParam,this.region);

        this.managed={
            params:this.params,
            accessManager:this.accessManager,
            siteContentSources:this.siteContentSources,
            fns:this.fns,
            buckets:this.buckets,
            queues:this.queues,
            events:this.events,
            eventTargets:this.eventTargets,
            apiRouteTargets:this.apiRouteTargets,
            userPools:this.userPools,
            resources:this.resources,
            beforeOutputs:this.beforeOutputs,
        };
    }

    protected generateOutputs()
    {
        // events
        for(const e of this.events){
            for(const t of this.eventTargets){
                if(t.managedName===e.eventName){
                    e.addTarget(t);
                }
            }
        }

        for(const res of this.resources){
            if(res.api){
                res.api.addMatchingTargets(this.apiRouteTargets);
            }
            res.onReady?.(this.managed);
        }

        for(const b of this.beforeOutputs){
            b(this.managed);
        }
        this.params.generateOutputs(this);
    }
}
