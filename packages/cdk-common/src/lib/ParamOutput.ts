import { HashMap, ParamTypeDef } from "@iyio/common";
import { CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";

export class ParamOutput
{

    public log=false;

    public readonly params:HashMap<string>={}

    public setParam(param:ParamTypeDef<string>,value:string){
        if(this.log){
            console.log(`ParamOutput - ${param.typeName} = ${value}`);
        }
        this.params[param.typeName]=value;

    }

    public generateOutputs(scope:Construct)
    {
        for(const e in this.params){
            new CfnOutput(scope,e+'Param',{value:this.params[e]??''});
        }
    }
}
