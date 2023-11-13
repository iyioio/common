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

    public async validateJwtAsync(jwt:string,options?:Record<string,any>):Promise<boolean>
    {

        const tokenUse:'access'|'id'=options?.['tokenUse']??'id';
        if(tokenUse!=='id' && tokenUse!=='access'){
            return false;
        }

        const verifier=tokenUse==='id'?
            (this.verifierId??(this.verifierId=CognitoJwtVerifier.create({
                userPoolId:this.config.userPoolId,
                clientId:this.config.clientId,
                tokenUse:"id",
            }))):
            (this.verifierId??(this.verifierId=CognitoJwtVerifier.create({
                userPoolId:this.config.userPoolId,
                clientId:this.config.clientId,
                tokenUse:"access",
            })));

        try{
            await verifier.verify(jwt);
            return true;
        }catch{
            return false;
        }
    }

}

