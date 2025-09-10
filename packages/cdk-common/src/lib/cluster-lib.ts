import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import { Construct } from 'constructs';
import { getDefaultVpc } from './cdk-lib.js';

let defaultCluster:ecs.Cluster|null=null;
let defaultProps:DefaultClusterProps|null=null;

export interface DefaultClusterProps
{
    scope:Construct;
    name:string;
    vpc?:ec2.IVpc;
    fargateAutoScaling?:boolean;
}

export const setDefaultClusterProps=(props:DefaultClusterProps)=>{
    if(defaultProps){
        throw new Error('Default cluster props already set');
    }
    defaultProps=props;
}

export const requireDefaultCluster=()=>{

    if(defaultCluster){
        return defaultCluster;
    }

    if(!defaultProps){
        throw new Error('Default Cluster props not set. First call (@iyio/cdk-common).setDefaultClusterProps');
    }

    defaultCluster=new ecs.Cluster(defaultProps.scope,defaultProps.name,{
        vpc:defaultProps.vpc??getDefaultVpc(defaultProps.scope),
        enableFargateCapacityProviders:defaultProps.fargateAutoScaling
    });

    return defaultCluster;
}

export const getDefaultCluster=()=>{
    if(defaultCluster){
        return defaultCluster;
    }
    if(!defaultProps){
        return null;
    }
    return requireDefaultCluster();
}
