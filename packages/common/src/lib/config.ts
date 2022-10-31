import { HashMap } from "./common-types";
import { DependencyContainer } from "./DependencyContainer";
import { ConfigValueNotFoundError } from "./errors";
import { IConfigRef } from "./_ref.common";

export interface IConfig
{
    /**
     * Gets a value or returns undefined if the config does not contain the value.
     */
    get(key:string):string|undefined;
    get(key:IConfigKey):string|undefined;

    getNumber(key:string):number|undefined;
    getNumber(key:IConfigKey):number|undefined;

    getBool(key:string):boolean|undefined;
    getBool(key:IConfigKey):boolean|undefined;

    /**
     * Gets a value or throws an error if the config does not contain the value.
     */
    require(key:string):string;
    require(key:IConfigKey):string;

    requireNumber(key:string):number;
    requireNumber(key:IConfigKey):number;

    requireBool(key:string):boolean;
    requireBool(key:IConfigKey):boolean;
}

export interface IConfigKey
{

    readonly key:string;

    get(deps?:DependencyContainer):string|undefined;
    getNumber(deps?:DependencyContainer):number|undefined;
    getBool(deps?:DependencyContainer):boolean|undefined;

    require(deps?:DependencyContainer):string;
    requireNumber(deps?:DependencyContainer):number;
    requireBool(deps?:DependencyContainer):boolean;
}

export const parseConfigBool=(value:string)=>{
    if(!value){
        return false;
    }
    value=value.toLowerCase();
    return value==='true' || value==='yes' || value==='1';

}


/**
 * A base IConfig class with default implementations for some functions.
 */
export abstract class BaseConfig implements IConfig
{

    protected abstract getValueByKey(key:string):string|undefined;

    public get(key:IConfigKey):string|undefined;
    public get(key:string):string|undefined;
    public get(key:string|IConfigKey):string|undefined
    {
        if(typeof key === 'object'){
            key=key.key;
        }
        return this.getValueByKey(key);
    }

    public getNumber(key:IConfigKey):number|undefined;
    public getNumber(key:string):number|undefined;
    public getNumber(key:string|IConfigKey):number|undefined
    {
        const value=this.get(key as any);
        if(value===undefined){
            return undefined;
        }

        return Number(value);
    }

    public getBool(key:IConfigKey):boolean|undefined;
    public getBool(key:string):boolean|undefined;
    public getBool(key:string|IConfigKey):boolean|undefined
    {
        const value=this.get(key as any);
        if(value===undefined){
            return undefined;
        }

        return parseConfigBool(value);
    }

    public require(key:IConfigKey):string;
    public require(key:string):string;
    public require(key:string|IConfigKey):string{
        if(typeof key === 'object'){
            key=key.key;
        }
        const value=this.getValueByKey(key);
        if(value===undefined){
            throw new ConfigValueNotFoundError(`key = ${key}`);
        }
        return value;
    }

    public requireNumber(key:IConfigKey):number;
    public requireNumber(key:string):number;
    public requireNumber(key:string|IConfigKey):number
    {
        const value=this.get(key as any);
        if(value===undefined){
            throw new ConfigValueNotFoundError(`key = ${key}`);
        }

        return Number(value);
    }

    public requireBool(key:IConfigKey):boolean;
    public requireBool(key:string):boolean;
    public requireBool(key:string|IConfigKey):boolean
    {
        const value=this.getBool(key as any);
        if(value===undefined){
            throw new ConfigValueNotFoundError(`key = ${key}`);
        }
        return value;
    }
}

/**
 * Supplies config values from a hashmap.
 */
export class HasMapConfig extends BaseConfig
{
    private readonly config:HashMap<string>;

    public constructor(config:HashMap)
    {
        super();
        this.config=config??{};
    }

    protected getValueByKey(key:string):string|undefined{
        return this.config[key];
    }
}

/**
 * Supplies config values from process.env
 */
export class EnvConfig extends BaseConfig
{
    protected getValueByKey(key:string):string|undefined{
        return (globalThis as any).process?.env?.[key];
    }
}

/**
 * Supplies config values contained in the DependencyContainer of the DepConfig.
 */
export class DepConfig extends BaseConfig
{
    private readonly deps:DependencyContainer;

    private configs:(IConfig|HashMap)[]=[];



    public constructor(deps:DependencyContainer)
    {
        super();
        this.deps=deps;
    }


    private lastDepCount=-1;
    private updateConfigs()
    {
        this.configs=this.deps.getAll(IConfigRef);
        this.lastDepCount=this.deps.count;
    }

    protected getValueByKey(key:string):string|undefined{
        if(this.deps.count!==this.lastDepCount){
            this.updateConfigs();
        }

        for(const c of this.configs){
            if(c===this){
                continue;
            }
            const value=getValueFromConfig(key,c);
            if(value!==undefined){
                return value;
            }
        }

        return undefined;
    }


}

/**
 * Returns a config value for an IConfig or HasMap
 */
export const getValueFromConfig=(key:string,config:IConfig|HashMap):string|undefined=>{
    if(!config){
        return undefined;
    }
    if(typeof config.get === 'function'){
        return (config as IConfig).get(key);
    }else{
        return (config as any)[key];
    }
}
