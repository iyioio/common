import { awsRegionParam } from '@iyio/aws';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AccessManager } from "./AccessManager";
import { ManagedProps } from './ManagedProps';
import { ParamOutput } from "./ParamOutput";

export class ManagedStack extends cdk.Stack
{

    protected readonly params=new ParamOutput();

    protected readonly accessManager=new AccessManager();

    public readonly managed:ManagedProps;

    public constructor(scope:Construct, id:string, props?:cdk.StackProps)
    {
        super(scope,id,props);

        this.params.setParam(awsRegionParam,this.region);

        this.managed={params:this.params,accessManager:this.accessManager};
    }

    protected generateOutputs()
    {
        this.params.generateOutputs(this);
    }
}
