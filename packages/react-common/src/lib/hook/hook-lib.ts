import { createContext, useContext, useEffect, useMemo } from "react";
import { useSubject } from "../rxjs-hooks";
import { HookCtrl } from "./HookCtrl";

export const HookCtrlReactContext=createContext<HookCtrl|null>(null);

export const useHookCtrl=()=>{
    return useContext(HookCtrlReactContext);
}

export const hookStateCtrlKey=Symbol('hookStateCtrlKey');

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

    useSubject(listenToChanges?ctrl.onStateChange:undefined);

    return ctrl;
}
