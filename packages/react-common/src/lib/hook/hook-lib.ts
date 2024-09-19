import { createContext, useContext } from "react";
import { HookCtrl } from "./HookCtrl";

export const HookCtrlReactContext=createContext<HookCtrl|null>(null);

export const useHookCtrl=()=>{
    return useContext(HookCtrlReactContext);
}

export const hookStateCtrlKey=Symbol('hookStateCtrlKey');
