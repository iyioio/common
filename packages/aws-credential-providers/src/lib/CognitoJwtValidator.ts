import { awsRegionParam } from '@iyio/aws';
import { JwtValidator, Scope } from '@iyio/common';
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { cognitoIdentityPoolIdParam, cognitoUserPoolClientIdParam, cognitoUserPoolIdParam } from './_types.aws-credential-providers';


export interface CognitoJwtValidatorConfig
{
    clientId:string;
    userPoolId:string;
    region:string;
    identityPoolId:string;
}

export const CognitoJwtValidatorType='CognitoJwtValidator';

export class CognitoJwtValidator implements JwtValidator
{
    public static fromScope(scope:Scope){
        return new CognitoJwtValidator({
            userPoolId:cognitoUserPoolIdParam(scope),
            clientId:cognitoUserPoolClientIdParam(scope),
            identityPoolId:cognitoIdentityPoolIdParam(scope),
            region:awsRegionParam(scope),
        });
    }

    public readonly type=CognitoJwtValidatorType;

    public readonly config:Readonly<CognitoJwtValidatorConfig>;

    constructor(config:CognitoJwtValidatorConfig)
    {
        this.config=config;
    }

    private verifierId:CognitoJwtVerifier<any,any,any>|null=null;
    private verifierAccess:CognitoJwtVerifier<any,any,any>|null=null;

    private getIdVerifier():CognitoJwtVerifier<any,any,any>{
        return this.verifierId??(this.verifierId=this.createVerifier('id'))
    }

    private getAccessVerifier():CognitoJwtVerifier<any,any,any>{
        return this.verifierId??(this.verifierId=this.createVerifier('access'))
    }

    private createVerifier(tokenUse:'id'|'access'){
        return CognitoJwtVerifier.create({
            userPoolId:this.config.userPoolId,
            clientId:this.config.clientId,
            tokenUse,
        });
    }

    private async verifyAsync(jwt:string,tokenUse:'id'|'access'):Promise<boolean>{
        try{
            await (tokenUse==='id'?this.getIdVerifier():this.getAccessVerifier()).verify(jwt);
            return true;
        }catch{
            return false;
        }
    }

    public async validateJwtAsync(jwt:string,options?:Record<string,any>):Promise<boolean>
    {
        const tokenUse:'access'|'id'=options?.['tokenUse'];
        if(tokenUse && (tokenUse!=='id' && tokenUse!=='access')){
            return false;
        }

        if(tokenUse){
            return await this.verifyAsync(jwt,tokenUse);
        }else{
            return (
                (await this.verifyAsync(jwt,'access')) ||
                (await this.verifyAsync(jwt,'id'))
            )
        }

    }

}

