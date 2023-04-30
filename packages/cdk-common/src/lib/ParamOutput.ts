import { HashMap, ParamTypeDef } from "@iyio/common";
import { CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";
import { EnvVarTarget, IParamOutputConsumer, ParamType } from "./cdk-types";



export class ParamOutput
{

    public log=false;

    public readonly params:HashMap<string>={}

    public readonly paramTypes:HashMap<ParamType>={}

    private readonly targets:EnvVarTarget[]=[];

    private readonly consumers:IParamOutputConsumer[]=[];

    public readonly envVars:Record<string,string>={};

    public copyEnvVars(names:string[]){
        for(const n of names){
            this.envVars[n]=process.env[n]??'';
        }
    }

    public addConsumer(consumer:IParamOutputConsumer){
        if(!this.consumers.includes(consumer)){
            this.consumers.push(consumer);
        }
    }

    /**
     * Var names in this list will not be added to evn targets.
     */
    public reservedEnvVars:string[]=['AWS_REGION']

    public addVarContainer(target:EnvVarTarget){
        if(!this.targets.includes(target)){
            this.targets.push(target);
        }
    }

    public excludeParamFrom(targetName:string,...params:(string|ParamTypeDef<string>)[]){
        const target=this.targets.find(t=>t.name===targetName);
        if(target){
            if(!target.excludeParams){
                target.excludeParams=[];
            }
            for(const param of params){
                target.excludeParams.push(param);
            }
        }
    }

    public setParam(param:ParamTypeDef<string>,value:string,type:ParamType='default'){
        if(this.log){
            console.log(`ParamOutput - ${param.typeName} = ${value}`);
        }
        this.params[param.typeName]=value;
        this.paramTypes[param.typeName]=type;

    }

    private outputsGenerated=false;

    public generateOutputs(scope:Construct)
    {

        if(this.outputsGenerated){
            throw new Error('ParamOutputs can only generate outputs once');
        }
        this.outputsGenerated=true;

        for(const name in this.envVars){
            for(const target of this.targets){
                if(target.varContainer){
                    target.varContainer.addEnvironment(name,this.envVars[name]??'');
                }
            }
        }

        for(const e in this.params){
            new CfnOutput(scope,e+'Param',{value:this.params[e]??''});

            const name=e.replace(/([a-z])([A-Z]+)/g,(_,l,u)=>l+'_'+u).toUpperCase();

            if(this.reservedEnvVars.includes(name)){
                continue;
            }

            for(const target of this.targets){

                if(this.paramTypes[e]==='fn' && !target.requiredParams.some(ep=>{
                    if(typeof ep ==='string'){
                        return ep===e
                    }else{
                        return ep.typeName===e
                    }
                })){
                    continue;
                }

                if(!target.excludeParams.some(ep=>{
                    if(typeof ep ==='string'){
                        return ep===e
                    }else{
                        return ep.typeName===e
                    }
                })){
                    target.varContainer?.addEnvironment(name,this.params[e]??'');
                }
            }
        }

        for(const c of this.consumers){
            c.consumeParams(this);
        }

    }
}
