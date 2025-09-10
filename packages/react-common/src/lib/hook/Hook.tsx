import { useEffect, useRef } from "react";
import { useCreateHookCtrl, useHookCtrl } from "./hook-lib.js";
import { HookCallback, HookCallbackWithCleanup } from "./hook-types.js";

export interface HookProps
{
    init?:HookCallbackWithCleanup;
    effect?:HookCallbackWithCleanup;
    deps?:any[]|string;
    dispose?:HookCallback;
    className?:string;
    stateDeps?:string[]|string;
    interval?:HookCallback;
    timeout?:HookCallback;
    delayMs?:number;
    initState?:Record<string,any>;
    /**
     * Alias of init
     */
    i?:HookCallbackWithCleanup;
}

export function Hook({
    i:initAlias,
    init=initAlias,
    effect,
    deps=[],
    dispose,
    className,
    stateDeps,
    interval,
    timeout,
    delayMs=1000,
    initState,
}:HookProps){

    const refs=useRef({init,effect,dispose,initState,delayMs,interval,timeout});
    refs.current.init=init;
    refs.current.effect=effect;
    refs.current.dispose=dispose;
    refs.current.delayMs=delayMs;
    refs.current.interval=interval;
    refs.current.timeout=timeout;

    const _ctrl=useHookCtrl();
    const ctrl=useCreateHookCtrl(_ctrl);

    if(typeof deps === 'string'){
        const names=deps.split(',');
        deps=[];
        for(const name of names){
            deps.push(ctrl.state[name.trim()]);
        }
    }
    if(stateDeps){
        if(typeof stateDeps === 'string'){
            stateDeps=stateDeps.split(',').map(v=>v.trim());
        }
        deps=[...deps];
        for(const prop of stateDeps){
            deps.push(ctrl.state[prop]);
        }
    }

    useEffect(()=>{
        if(refs.current.initState){
            ctrl.mergeState(refs.current.initState)
        }
        const initCleanup=refs.current.init?.(ctrl.state,ctrl);

        let tiv:any;
        let iiv:any;
        if(refs.current.timeout){
            tiv=setTimeout(()=>{
                refs.current.timeout?.(ctrl.state,ctrl);
            },refs.current.delayMs)
        }
        if(refs.current.interval){
            tiv=setInterval(()=>{
                refs.current.interval?.(ctrl.state,ctrl);
            },refs.current.delayMs)
        }

        return ()=>{
            clearTimeout(tiv);
            clearInterval(iiv);
            initCleanup?.();
            refs.current.dispose?.(ctrl.state,ctrl);
        }
    },[ctrl]);

    useEffect(()=>{
        const effect=refs.current.effect;
        if(!effect){
            return;
        }
        const cleanup=effect(ctrl.state,ctrl);
        if(!cleanup){
            return;
        }
        return ()=>{
            cleanup();
        }
    },Array.isArray(deps)?deps:[]);

    return (
        null
    )

}
