import { HashMap } from "./common-types";
import { IConfig, IConfigKey } from "./config";
import { DependencyContainer } from "./DependencyContainer";
import { globalDeps } from "./globalDeps";
import { IConfigRef } from "./_ref.common";
import { cf } from "./_service.common";


/**
 * Used by the @iyio/babel-plugin-env to identify code to replace
 */
export const STATIC_ENV_VARS=Symbol('STATIC_ENV_VARS');
export type StaticEnvVarsType=typeof STATIC_ENV_VARS;

/**
 * Registers a config for the given DependencyContainer.
 * @param deps if null globalDeps is used.
 */
export const registerConfig=(deps:DependencyContainer|null,config:IConfig|HashMap|StaticEnvVarsType)=>{
    if(typeof config === 'symbol'){
        return;
    }
    if(deps===null){
        deps=globalDeps;
    }
    deps.registerValue(IConfigRef,config);
}


export class ConfigKey implements IConfigKey
{

    public readonly key:string;

    public constructor(key:string)
    {
        this.key=key;
    }

    public get(deps:DependencyContainer=globalDeps):string|undefined
    {
        return cf(deps).get(this.key);
    }

    public getNumber(deps:DependencyContainer=globalDeps):number|undefined
    {
        return cf(deps).getNumber(this.key);
    }

    public getBool(deps:DependencyContainer=globalDeps):boolean|undefined
    {
        return cf(deps).getBool(this.key);
    }

    public require(deps:DependencyContainer=globalDeps):string
    {
        return cf(deps).require(this.key);
    }

    public requireNumber(deps:DependencyContainer=globalDeps):number
    {
        return cf(deps).requireNumber(this.key);
    }

    public requireBool(deps:DependencyContainer=globalDeps):boolean
    {
        return cf(deps).requireBool(this.key);
    }
}

export const createConfigKey=(key:string):IConfigKey=>new ConfigKey(key);
