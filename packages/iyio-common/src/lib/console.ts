import { LogLevel } from "./log.js";


/**
 * When passed to any of the console log functions listening will be disabled for the call
 */
export const ignoreConsoleListeners=Symbol('ignoreConsoleListenerFlag');

export interface ConsoleEntry
{
    level:LogLevel;
    args:any[];
}

export type ConsoleListener=(entry:ConsoleEntry)=>void;

const listeners:ConsoleListener[]=[];

const report=(args:any[],level:LogLevel)=>
{
    const entry:ConsoleEntry={level,args};
    for(const l of listeners){
        l(entry);
    }
}


export const addConsoleListener=(listener:ConsoleListener):()=>boolean=>
{
    enableConsoleListening();
    listeners.push(listener);
    return ()=>{
        return removeConsoleListener(listener);
    }
}

export const removeConsoleListener=(listener:ConsoleListener):boolean=>
{
    const i=listeners.indexOf(listener);
    if(i===-1){
        return false;
    }
    listeners.splice(i,1);
    return true;
}

let _isConsoleLogReplaced=false;
export const isConsoleLogReplaced=()=>_isConsoleLogReplaced;

let consoleIntercepted=false;
export const enableConsoleListening=()=>
{
    if(consoleIntercepted){
        return;
    }

    consoleIntercepted=true;

    const defaultLog=console['log'];
    const defaultInfo=console.info;
    const defaultDebug=console.debug;
    const defaultWarn=console.warn;
    const defaultError=console.error;

    const log=(...args:any[])=>
    {
        const i=args.indexOf(ignoreConsoleListeners);
        if(i!==-1){
            args.splice(i,1);
        }
        if(defaultLog){
            defaultLog.apply(console,args);
        }
        if(i===-1){
            report(args,LogLevel.log);
        }
    }
    console['log']=log;
    _isConsoleLogReplaced=console['log']===log;

    console.info=(...args)=>
    {
        const i=args.indexOf(ignoreConsoleListeners);
        if(i!==-1){
            args.splice(i,1);
        }
        if(defaultInfo){
            defaultInfo.apply(console,args);
        }
        if(i===-1){
            report(args,LogLevel.info);
        }
    }

    console.debug=(...args)=>
    {
        const i=args.indexOf(ignoreConsoleListeners);
        if(i!==-1){
            args.splice(i,1);
        }
        if(defaultDebug){
            defaultDebug.apply(console,args);
        }
        if(i===-1){
            report(args,LogLevel.debug);
        }
    }

    console.warn=(...args)=>
    {
        const i=args.indexOf(ignoreConsoleListeners);
        if(i!==-1){
            args.splice(i,1);
        }
        if(defaultWarn){
            defaultWarn.apply(console,args);
        }
        if(i===-1){
            report(args,LogLevel.warn);
        }
    }

    console.error=(...args)=>
    {
        const i=args.indexOf(ignoreConsoleListeners);
        if(i!==-1){
            args.splice(i,1);
        }
        if(defaultError){
            defaultError.apply(console,args);
        }
        if(i===-1){
            report(args,LogLevel.error);
        }
    }
}
