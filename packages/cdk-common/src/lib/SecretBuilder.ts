import { ParamTypeDef } from "@iyio/common";
import * as secrets from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from "constructs";
import { ManagedProps, getDefaultManagedProps } from "./ManagedProps";
import { AccessGranter, IAccessGrantGroup } from "./cdk-types";

export interface SecretBuilderProps
{
    secrets:SecretInfo[];
    managed?:ManagedProps;
}

export interface SecretInfo
{
    name:string;
    arnParam?:ParamTypeDef<string>;
    grantAccess?:boolean;
}

export interface SecretResult
{
    info:SecretInfo;
    secret:secrets.Secret;
}

export class SecretBuilder extends Construct implements IAccessGrantGroup
{
    public readonly secrets:SecretResult[];

    public readonly accessGrants:AccessGranter[]=[];

    public constructor(scope:Construct, name:string, {
        secrets:secretsAry,
        managed:{
            params,
            accessManager,
            resources,
        }=getDefaultManagedProps(),
    }:SecretBuilderProps)
    {

        super(scope,name);

        const secretInfos:SecretResult[]=[];


        for(const info of secretsAry){

            const secret=new secrets.Secret(this,info.name);

            resources.push({name:info.name,secret})

            if(info.arnParam){
                params?.setParam(info.arnParam,secret.secretArn);
            }

            if(info.grantAccess){
                this.accessGrants.push({
                    grantName:info.name,
                    grant:request=>{
                        if(request.types?.includes('read')){
                            secret.grantRead(request.grantee);
                        }
                        if(request.types?.includes('write')){
                            secret.grantWrite(request.grantee);
                        }
                    }
                })
            }

            secretInfos.push({
                info,
                secret,
            })

        }

        this.secrets=secretInfos;

        accessManager?.addGroup(this);
    }
}
