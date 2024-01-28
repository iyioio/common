import { Construct } from "constructs";
import { ApiGateway, ApiGatewayProps } from "./ApiGateway";
import { ManagedProps } from "./ManagedProps";

export interface ApiGatewayInfo extends Omit<ApiGatewayProps,'accountId'|'region'>
{
    name:string;
}

export interface ApiGatewayBuilderProps
{
    accountId:string;
    region:string;
    apis:ApiGatewayInfo[];
    managed?:ManagedProps;
}

export class ApiGatewayBuilder extends Construct
{
    public readonly apis:ApiGateway[];

    public constructor(scope:Construct,name:string,{
        apis,
        managed,
        accountId,
        region,
    }:ApiGatewayBuilderProps){

        super(scope,name);

        this.apis=apis.map(c=>new ApiGateway(this,c.name,{
            ...c,
            accountId,
            region,
            managed:c.managed??managed
        }));
    }
}
