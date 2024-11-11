import { createContext, useContext, useEffect } from "react";
import { SurfaceCtrl } from "./SurfaceCtrl";
import { ViewportCtrl } from "./ViewportCtrl";

export const ViewportCtrlReactContext=createContext<ViewportCtrl|null>(null);

export const useViewportCtrl=()=>{
    return useContext(ViewportCtrlReactContext);
}

export const useLockViewportNav=(enabled=true)=>{
    const ctrl=useViewportCtrl();

    useEffect(()=>{
        if(!ctrl || !enabled){
            return;
        }
        ctrl.navLockCount++;
        return ()=>{
            ctrl.navLockCount--;
        }
    },[ctrl,enabled]);
}

export const SurfaceCtrlReactContext=createContext<SurfaceCtrl|null>(null);

export const useSurfaceCtrl=()=>{
    return useContext(SurfaceCtrlReactContext);
}
