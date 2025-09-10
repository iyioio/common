import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from "constructs";
import { ManagedProps } from "./ManagedProps.js";
import { SqlCluster, SqlClusterOptionsBase } from "./SqlCluster.js";
import { getDefaultVpc, isCdkEnvPatternMatch } from './cdk-lib.js';

export interface SqlClusterBuilderCluster extends SqlClusterOptionsBase
{
    name:string;

    /**
     * An environment pattern that can be used to disable a queue
     */
    envPattern?:string;
}

export interface SqlClusterBuilderOptions
{
    managed?:ManagedProps;
    vpc?:ec2.IVpc;
    clusters:SqlClusterBuilderCluster[];
}

export class SqlClusterBuilder extends Construct
{

    public readonly clusters:SqlCluster[];

    public constructor(scope:Construct,id:string,{
        managed,
        vpc=getDefaultVpc(scope),
        clusters,
    }:SqlClusterBuilderOptions)
    {
        super(scope,id);

        this.clusters=[];

        for(const info of clusters){

            if(!isCdkEnvPatternMatch(info.envPattern)){
                continue;
            }
            this.clusters.push(new SqlCluster(this,info.name,{vpc,managed,...info}))
        }
    }
}
