
import { open, url, waitForDebugger } from 'node:inspector';

let debuggerStarted=false;
export const triggerNodeBreakpoint=()=>
{
    if(url() || debuggerStarted){
        // eslint-disable-next-line no-debugger
        debugger;
        return;
    }
    console.log(`starting debugger. pid:${process.pid}`);
    debuggerStarted=true;
    open();
    waitForDebugger();
    // eslint-disable-next-line no-debugger
    debugger;
}
