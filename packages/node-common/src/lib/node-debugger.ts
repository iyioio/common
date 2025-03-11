
import { open, url, waitForDebugger } from 'node:inspector';

export interface TriggerBreakpointOptions
{
    disable?:boolean;
    port?:number;
    host?:string;
}

let debuggerStarted=false;
export const triggerNodeBreakpoint=(options?:TriggerBreakpointOptions|boolean)=>
{
    if(typeof options === 'boolean'){
        options={
            disable:options
        }
    }

    if(options?.disable){
        return;
    }
    if(url() || debuggerStarted){
        // eslint-disable-next-line no-debugger
        debugger;
        return;
    }
    console.log(`starting debugger. pid:${process.pid}`);
    debuggerStarted=true;
    open(options?.port,options?.host??'0.0.0.0');
    waitForDebugger();
    // eslint-disable-next-line no-debugger
    debugger;
}
