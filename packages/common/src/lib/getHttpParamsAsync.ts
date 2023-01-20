import { paramsCheckParam } from "./common-params";
import { HashMap } from "./common-types";
import { httpClient } from "./http.deps";
import { createScope } from "./scope-lib";
import { ParamTypeDef } from "./scope-types";

export interface GetHttpParamsOptions
{
    /**
     * URL to request params from. The returned value should be a JSON object containing params
     */
    url?:string;

    /**
     * If the given param is defined getting client params will be skipped. Pass null to skip
     * checking for defined params
     * @default (@iyio/common).paramsCheckParam
     */
    testParam?:ParamTypeDef<any>|null;

    /**
     * If the given function returns true getting client params will be skipped
     */
    checkParamsDefined?:()=>boolean;
}

/**
 * Loads params from an http endpoint
 */
export async function getHttpParamsAsync({
    url='/__DOT_ENV__.json',
    testParam=paramsCheckParam,
    checkParamsDefined,
}:GetHttpParamsOptions={}):Promise<HashMap<string>|undefined>
{
    try{

        const scope=createScope();

        if(testParam){
            try{
                // test to see if env vars are already defined
                testParam.require();
                return undefined;
            }catch{/* */}
        }

        if(checkParamsDefined?.()){
            return undefined;
        }

        const params=await httpClient(scope).getAsync<HashMap<string>>(url);

        if(!params){
            throw new Error(`No params returned from . url = ${url}`);
        }

        return params;
    }catch{
        console.error(`config not found at ${url}`);
        return undefined;
    }
}
