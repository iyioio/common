import { ParamTypeDef, envNameToName, strToUpperSnakeCase } from "@iyio/common";
import { CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";
import { JsonLambdaLayer } from "./JsonLambdaLayer";
import { EnvVarTarget, IParamOutputConsumer, ParamType } from "./cdk-types";

export interface ParamOutputOptions
{
    /**
     * If true a lambda layer will be created the contains shared params instead of injecting
     * params as environment variables. enableLambdaConfigLayer can be helpful when you have a
     * stack with a large number of param generating resources since Lambda functions have a
     * 4K env var limit.
     */
    enableLambdaConfigLayer?:boolean;

    /**
     * The managed name of functions to excluded from the lambda config layer.
     */
    excludeFnsFromConfigLayer?:string[];

    /**
     * The location where params config is located in the config layer
     * @default "/opt/params-output.json"
     */
    paramsConfigLayerPath?:string;

    /**
     * If set and bucketKey is not defined keySalt will be used to salt the random key that is generated.
     */
    lambdaConfigKeySalt?:string;
}

export class ParamOutput
{

    public log=false;

    public readonly params:Record<string,string>={}

    public readonly paramTypes:Record<string,ParamType>={}

    private readonly targets:EnvVarTarget[]=[];

    private readonly consumers:IParamOutputConsumer[]=[];

    public readonly envVars:Record<string,string>={};

    public envVarPrefix:string|null=null;

    public enableLambdaConfigLayer:boolean;

    public excludeFnsFromConfigLayer:string[];

    public paramsConfigLayerPath:string;

    public lambdaConfigKeySalt?:string;

    public constructor({
        enableLambdaConfigLayer=false,
        excludeFnsFromConfigLayer=[],
        paramsConfigLayerPath='/opt/params-output.json',
        lambdaConfigKeySalt,
    }:ParamOutputOptions={}){
        this.enableLambdaConfigLayer=enableLambdaConfigLayer;
        this.excludeFnsFromConfigLayer=excludeFnsFromConfigLayer;
        this.paramsConfigLayerPath=paramsConfigLayerPath;
        this.lambdaConfigKeySalt=lambdaConfigKeySalt;
    }

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

        const hasFnTargets=this.targets.some(t=>t.fn && !this.excludeFnsFromConfigLayer.includes(t.name));
        let layer:JsonLambdaLayer|undefined;
        const varMap=this.getDefaultSharedVarMap();
        if(hasFnTargets && this.enableLambdaConfigLayer){
            layer=new JsonLambdaLayer(scope,'ConfigLayer',{
                json:varMap,
                zipFilePath:'params-output.json',
                keySalt:this.lambdaConfigKeySalt,
            })
        }

        for(const name in this.envVars){
            for(const target of this.targets){
                if(target.varContainer){
                    target.varContainer.addEnvironment(name,this.envVars[name]??'');
                }
            }
        }

        const skipTargets:EnvVarTarget[]=[];
        if(layer){
            for(const target of this.targets){
                if(!target.fn || this.excludeFnsFromConfigLayer.includes(target.name)){
                    continue;
                }
                target.fn.addEnvironment('IYIO_CONFIG_JSON_PATH',this.paramsConfigLayerPath)
                target.fn.addLayers(layer.layer);
                skipTargets.push(target);
            }
        }

        for(const e in this.params){
            new CfnOutput(scope,e+'Param',{value:this.params[e]??''});

            const name=strToUpperSnakeCase(e);

            if(this.reservedEnvVars.includes(name)){
                continue;
            }

            for(const target of this.targets){

                if(skipTargets.includes(target) && varMap[e]!==undefined){
                    continue
                }

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

    public getVarMap(type?:ParamType):Record<string,string>{
        const output={...this.params}
        if(type){
            for(const e in output){
                if(this.paramTypes[e]!==type){
                    delete output[e];
                }
            }
        }
        for(const e in this.envVars){
            output[envNameToName(e,this.envVarPrefix)]=this.envVars[e] as string;
        }
        return output;
    }

    public getDefaultSharedVarMap():Record<string,string>{
        const map=this.getVarMap('default');
        for(const t of this.targets){
            for(const e of t.excludeParams){
                if(typeof e === 'string'){
                    delete map[e];
                }else{
                    delete map[e.typeName];
                }
            }
        }
        return map;
    }
}
