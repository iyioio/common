import { Construct } from "constructs";
import { Container, ContainerProps } from "./Container";
import { ManagedProps } from "./ManagedProps";

export interface ContainerInfo extends ContainerProps
{
    name:string;
}

export interface ContainerBuilderProps
{
    containers:ContainerInfo[];
    managed?:ManagedProps;
}

export class ContainerBuilder extends Construct
{

    public readonly containers:Container[];

    public constructor(scope:Construct,name:string,{
        containers,
        managed
    }:ContainerBuilderProps){

        super(scope,name);

        this.containers=containers.map(c=>new Container(this,c.name,{
            ...c,
            managed:c.managed??managed
        }));
    }
}
