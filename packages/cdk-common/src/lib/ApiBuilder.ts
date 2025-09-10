import { Construct } from "constructs";
import { Api, ApiProps } from "./Api.js";
import { ManagedProps } from "./ManagedProps.js";

export interface ApiInfo extends ApiProps
{
    name:string;
}

export interface ApiBuilderProps
{
    apis:ApiInfo[];
    managed?:ManagedProps;
}

export class ApiBuilder extends Construct
{
    public readonly apis:Api[];

    public constructor(scope:Construct,name:string,{
        apis,
        managed,
    }:ApiBuilderProps){

        super(scope,name);

        this.apis=apis.map(c=>new Api(this,c.name,{
            ...c,
            managed:c.managed??managed
        }));
    }
}
