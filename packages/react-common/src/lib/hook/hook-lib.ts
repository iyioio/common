import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { HookCtrl } from "./HookCtrl";

export const HookCtrlReactContext=createContext<HookCtrl|null>(null);

export const useHookCtrl=()=>{
    return useContext(HookCtrlReactContext);
}

export const useCreateHookCtrl=(existingCtrl?:HookCtrl|null,listenToChanges=true):HookCtrl=>{
    const ctrl=useMemo(()=>existingCtrl??new HookCtrl(),[existingCtrl]);
    const dispose=!existingCtrl;
    useEffect(()=>{
        if(!dispose){
            return;
        }
        return ()=>{
            ctrl.dispose();
        }
    },[ctrl,dispose]);

    const [,setRender]=useState(0);
    useEffect(()=>{
        if(!listenToChanges){
            return;
        }
        let iv:any;
        const sub=ctrl.changeDetector.onChange.subscribe(()=>{
            clearTimeout(iv);
            iv=setTimeout(()=>{
                setRender(v=>v+1);
            },1);
        })
        return ()=>{
            clearTimeout(iv);
            sub.unsubscribe();
        }
    },[listenToChanges,ctrl]);

    return ctrl;
}

