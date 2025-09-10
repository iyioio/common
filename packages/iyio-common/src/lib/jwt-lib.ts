import { continueFunction } from "./common-lib.js";
import { JwtValidators } from "./jwt.deps.js";
import { rootScope } from "./scope-lib.js";
import { Scope } from "./scope-types.js";

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
