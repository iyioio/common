import { dupDeleteUndefined } from "./object.js";

export enum LogLevel{
    none=0,
    info=1,
    log=2,
    warn=4,
    error=8,
    debug=16,
    all=31
}

export interface LogEntry
{
    code?:string|number;
    level:LogLevel;
    args:any[];
}

export type LogListener=(entry:LogEntry)=>void;

export interface LogConfig
{
    level:LogLevel;
}


export type LogFunction=<T>(...values:[T,...any])=>T;
export type LogCodeFunction=<T>(code:string|number,...values:[T,...any])=>T;

export type Log=LogFunction & {
    logName:string;
    debug:LogFunction;
    info:LogFunction;
    log:LogFunction;
    warn:LogFunction;
    error:LogFunction;
    debugCode:LogCodeFunction;
    infoCode:LogCodeFunction;
    logCode:LogCodeFunction;
    warnCode:LogCodeFunction;
    errorCode:LogCodeFunction;
    report:(args:any[],level:LogLevel,code?:string|number)=>void;

    /**
     * Gets and sets logging configuration
     */
    config:(config?:Partial<LogConfig>)=>LogConfig;

    addListener:(listener:LogListener)=>void;
    removeListener:(listener:LogListener)=>boolean;
}

export const createLog=(name:string,configDefaults?:Partial<LogConfig>):Log=>{

    let config:LogConfig={
        ...configDefaults,
        level:configDefaults?.level??1,
    }

    const listeners:LogListener[]=[];

    const report=(args:any[],level:LogLevel,code?:string|number)=>
    {
        const entry:LogEntry={level,args};
        if(code!==undefined){
            entry.code=code;
        }
        for(const l of listeners){
            try{
                l(entry);
            }catch{
                // do nothing
            }
        }
    }

    const log:Log=<T>(...values:[T,...any])=>{
        if(config.level>=LogLevel.log){
            console.log(...values);
        }
        report(values,LogLevel.log);
        return values[0] as T;
    }

    log.logName=name;

    const _log:LogFunction=<T>(...values:[T,...any])=>{
        if(config.level>=LogLevel.log){
            console.log(...values);
        }
        report(values,LogLevel.log);
        return values[0] as T;
    }
    const info:LogFunction=<T>(...values:[T,...any])=>{
        if(config.level>=LogLevel.info){
            console.info(...values);
        }
        report(values,LogLevel.info);
        return values[0] as T;
    }
    const warn:LogFunction=<T>(...values:[T,...any])=>{
        if(config.level>=LogLevel.warn){
            console.warn(...values);
        }
        report(values,LogLevel.warn);
        return values[0] as T;
    }
    const error:LogFunction=<T>(...values:[T,...any])=>{
        if(config.level>=LogLevel.error){
            console.error(...values);
        }
        report(values,LogLevel.error);
        return values[0] as T;
    }
    const debug:LogFunction=<T>(...values:[T,...any])=>{
        if(config.level>=LogLevel.debug){
            console.debug(...values);
        }
        report(values,LogLevel.debug);
        return values[0] as T;
    }



    const logCode:LogCodeFunction=<T>(code:string|number,...values:[T,...any])=>{
        if(config.level>=LogLevel.log){
            console.log(`code:${code}`,...values);
        }
        report(values,LogLevel.log,code);
        return values[0] as T;
    }
    const infoCode:LogCodeFunction=<T>(code:string|number,...values:[T,...any])=>{
        if(config.level>=LogLevel.info){
            console.info(`code:${code}`,...values);
        }
        report(values,LogLevel.info,code);
        return values[0] as T;
    }
    const warnCode:LogCodeFunction=<T>(code:string|number,...values:[T,...any])=>{
        if(config.level>=LogLevel.warn){
            console.warn(`code:${code}`,...values);
        }
        report(values,LogLevel.warn,code);
        return values[0] as T;
    }
    const errorCode:LogCodeFunction=<T>(code:string|number,...values:[T,...any])=>{
        if(config.level>=LogLevel.error){
            console.error(`code:${code}`,...values);
        }
        report(values,LogLevel.error,code);
        return values[0] as T;
    }
    const debugCode:LogCodeFunction=<T>(code:string|number,...values:[T,...any])=>{
        if(config.level>=LogLevel.debug){
            console.debug(`code:${code}`,...values);
        }
        report(values,LogLevel.debug,code);
        return values[0] as T;
    }

    log.info=info;
    log.log=_log;
    log.warn=warn;
    log.error=error;
    log.debug=debug;
    log.report=report;
    log.logCode=logCode;
    log.infoCode=infoCode;
    log.warnCode=warnCode;
    log.errorCode=errorCode;
    log.debugCode=debugCode;
    log.config=(_config)=>{

        if(_config){
            config={
                ...config,
                ...dupDeleteUndefined(_config)
            }
        }

        return {...config}
    }
    log.addListener=(listener)=>{
        listeners.push(listener);
    }
    log.removeListener=(listener)=>{
        const i=listeners.indexOf(listener);
        if(i!==-1){
            listeners.splice(i,1);
            return true;
        }else{
            return false;
        }
    }

    return log;
}

export const log=createLog('default-log');

