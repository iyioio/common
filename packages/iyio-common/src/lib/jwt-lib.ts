import { continueFunction } from "./common-lib";
import { JwtValidators } from "./jwt.deps";
import { rootScope } from "./scope-lib";
import { Scope } from "./scope-types";

export interface JwtOptions
{
    jwt:string;
    options?:Record<string,any>;
}

export const validateJwt=async (jwt:string|JwtOptions,scope:Scope=rootScope):Promise<boolean>=>{
    const r=await scope.to(JwtValidators).getFirstAsync<boolean>(null,async v=>{
        const r=(typeof jwt==='string')?
            await v.validateJwtAsync(jwt):
            await v.validateJwtAsync(jwt.jwt,jwt.options);
        return r?true:continueFunction;
    })
    return r===true;
}
