import { awsRegionParam } from '@iyio/aws';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AccessManager } from "./AccessManager";
import { ManagedProps } from './ManagedProps';
import { ParamOutput } from "./ParamOutput";
import { NamedBucket, NamedFn, NamedQueue, SiteContentSource } from './cdk-types';

export class ManagedStack extends cdk.Stack
{

    protected readonly params=new ParamOutput();

    protected readonly accessManager:AccessManager;

    protected readonly siteContentSources:SiteContentSource[]=[];

    protected readonly fns:NamedFn[]=[];

    protected readonly buckets:NamedBucket[]=[];

    protected readonly queues:NamedQueue[]=[];

    protected readonly beforeOutputs:((managed:ManagedProps)=>void)[]=[];

    public readonly managed:ManagedProps;

    public constructor(scope:Construct, id:string, props?:cdk.StackProps)
    {
        super(scope,id,props);

        this.accessManager=new AccessManager(this.account,this.region);

        this.params.setParam(awsRegionParam,this.region);

        this.managed={
            params:this.params,
            accessManager:this.accessManager,
            siteContentSources:this.siteContentSources,
            fns:this.fns,
            buckets:this.buckets,
            queues:this.queues,
            beforeOutputs:this.beforeOutputs,
        };
    }

    protected generateOutputs()
    {
        for(const b of this.beforeOutputs){
            b(this.managed);
        }
        this.params.generateOutputs(this);
    }
}
