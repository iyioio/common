import { useEffect, useMemo, useState } from "react";
import { AnyCompViewCtrl } from "./AnyCompViewCtrl";
import { AcComp } from "./any-comp-types";

export const useCreateAnyCompViewCtrl=(comp:AcComp|null|undefined):AnyCompViewCtrl|null=>{
    const ctrl=useMemo(()=>comp?new AnyCompViewCtrl(comp):null,[comp]);
    return ctrl;
}

/**
 * Returns an integer that increments each time a matching property change occurs. If no property
 * name is given the integer increments with every property change.
 */
export const useUpdateOnAnyCompPropChange=(ctrl:AnyCompViewCtrl|null|undefined,propName?:string)=>{
    const [render,setRender]=useState(0);
    useEffect(()=>{
        if(!ctrl){
            return;
        }
        const sub=ctrl.onPropChange.subscribe(v=>{
            if(!propName || v===propName || !v){
                setRender(v=>v+1);
            }
        });
        return ()=>{
            sub.unsubscribe();
        }
    },[ctrl,propName]);
    return render;
}
