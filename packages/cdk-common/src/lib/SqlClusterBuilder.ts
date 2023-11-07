import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from "constructs";
import { ManagedProps } from "./ManagedProps";
import { SqlCluster, SqlClusterOptionsBase } from "./SqlCluster";

export interface SqlClusterBuilderCluster extends SqlClusterOptionsBase
{
    name:string
}

export interface SqlClusterBuilderOptions
{
    managed?:ManagedProps;
    vpc:ec2.IVpc;
    clusters:SqlClusterBuilderCluster[];
}

export class SqlClusterBuilder extends Construct
{

    public readonly clusters:SqlCluster[];

    public constructor(scope:Construct,id:string,{
        managed,
        vpc,
        clusters,
    }:SqlClusterBuilderOptions)
    {
        super(scope,id);

        this.clusters=clusters.map(c=>new SqlCluster(this,c.name,{vpc,managed,...c}))
    }
}
