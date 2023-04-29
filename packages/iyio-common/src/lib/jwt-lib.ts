import { continueFunction } from "./common-lib";
import { JwtValidators } from "./jwt.deps";
import { rootScope } from "./scope-lib";
import { Scope } from "./scope-types";

export const validateJwt=async (jwt:string,scope:Scope=rootScope):Promise<boolean>=>{
    const r=await scope.to(JwtValidators).getFirstAsync<boolean>(null,async v=>{
        const r=await v.validateJwtAsync(jwt);
        return r?true:continueFunction;
    })
    return r===true;
}
