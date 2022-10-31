import { HashMap } from "./common-types";
import { IConfig, IConfigKey } from "./config";
import { DependencyContainer } from "./DependencyContainer";
import { globalDeps } from "./globalDeps";
import { IConfigRef } from "./_ref.common";
import { cf } from "./_service.common";




// const depConfigMap:HashMap<DepConfig>={};
// /**
//  * Returns an IConfig for the given DependencyContainer.
//  * @param deps if null globalDeps is used.
//  */
// export const getConfig=(deps:DependencyContainer|null):IConfig=>
// {
//     if(deps===null){
//         deps=globalDeps;
//     }
//     let depConfig=depConfigMap[deps.id];
//     if(!depConfig){
//         depConfig=new DepConfig(deps);
//         depConfigMap[deps.id]=depConfig;
//     }

//     return depConfig;
// }

// interface getConfigValueOverloads
// {
//     (deps:DependencyContainer|null,key:IConfigKey):string|undefined;
//     (deps:DependencyContainer|null,key:string):string|undefined;
// }
// /**
//  * Returns a config value from the given DependencyContainer.
//  * @param deps if null globalDeps is used.
//  */
// export const getConfigValue:getConfigValueOverloads=(deps:DependencyContainer|null,key:string|IConfigKey)=>
// {
//     if(deps===null){
//         deps=globalDeps;
//     }

//     const config=getConfig(deps);

//     return config.get(key as any);
// }

// interface getConfigNumberOverloads
// {
//     (deps:DependencyContainer|null,key:IConfigKey):number|undefined;
//     (deps:DependencyContainer|null,key:string):number|undefined;
// }
// export const getConfigNumber:getConfigNumberOverloads=(deps:DependencyContainer|null,key:string|IConfigKey)=>
// {
//     if(deps===null){
//         deps=globalDeps;
//     }

//     const config=getConfig(deps);

//     return config.getNumber(key as any);
// }

// interface getConfigBoolOverloads
// {
//     (deps:DependencyContainer|null,key:IConfigKey):boolean|undefined;
//     (deps:DependencyContainer|null,key:string):boolean|undefined;
// }
// export const getConfigBool:getConfigBoolOverloads=(deps:DependencyContainer|null,key:string|IConfigKey)=>
// {
//     if(deps===null){
//         deps=globalDeps;
//     }

//     const config=getConfig(deps);

//     return config.getBool(key as any);
// }


// interface requireConfigValueOverloads
// {
//     (deps:DependencyContainer|null,key:IConfigKey):string;
//     (deps:DependencyContainer|null,key:string):string;
// }
// /**
//  * Returns a config value from the given DependencyContainer. If the config value does not exists
//  * an error is thrown.
//  * @param deps if null globalDeps is used.
//  */
// export const requireConfigValue:requireConfigValueOverloads=(deps:DependencyContainer|null,key:string|IConfigKey)=>
// {
//     if(deps===null){
//         deps=globalDeps;
//     }

//     const config=getConfig(deps);

//     return config.require(key as any);
// }

// interface requireConfigNumberOverloads
// {
//     (deps:DependencyContainer|null,key:IConfigKey):number;
//     (deps:DependencyContainer|null,key:string):number;
// }
// export const requireConfigNumber:requireConfigNumberOverloads=(deps:DependencyContainer|null,key:string|IConfigKey)=>
// {
//     if(deps===null){
//         deps=globalDeps;
//     }

//     const config=getConfig(deps);

//     return config.requireNumber(key as any);
// }

// interface requireConfigBoolOverloads
// {
//     (deps:DependencyContainer|null,key:IConfigKey):boolean;
//     (deps:DependencyContainer|null,key:string):boolean;
// }
// export const requireConfigBool:requireConfigBoolOverloads=(deps:DependencyContainer|null,key:string|IConfigKey)=>
// {
//     if(deps===null){
//         deps=globalDeps;
//     }

//     const config=getConfig(deps);

//     return config.requireBool(key as any);
// }


/**
 * Registers a config for the given DependencyContainer.
 * @param deps if null globalDeps is used.
 */
export const registerConfig=(deps:DependencyContainer|null,config:IConfig|HashMap)=>{
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
