import { useEffect, useMemo, useState } from "react";
import { AnyCompViewCtrl } from "./AnyCompViewCtrl.js";
import { AcComp } from "./any-comp-types.js";

export const useCreateAnyCompViewCtrl=(comp:AcComp|null|undefined):AnyCompViewCtrl|null=>{
    const ctrl=useMemo(()=>comp?new AnyCompViewCtrl(comp):null,[comp]);
    return ctrl;
}

/**
 * Returns an integer that increments each time a matching property change occurs. If no property
 * name is given the integer increments with every property change.
 */
export const useUpdateOnAnyCompPropChange=(ctrl:AnyCompViewCtrl|null|undefined,propName?:string|string[]|Record<string,string>|null)=>{
    const [render,setRender]=useState(0);
    useEffect(()=>{
        if(!ctrl || propName===null){
            return;
        }
        const isAry=Array.isArray(propName);
        const isStr=(typeof propName)==='string';
        const sub=ctrl.onPropChange.subscribe(changed=>{
            if( !propName ||
                !changed ||
                (isAry?propName.includes(changed):isStr?changed===propName:propName?.[changed])
            ){
                setRender(v=>v+1);
            }
        });
        return ()=>{
            sub.unsubscribe();
        }
    },[ctrl,propName]);
    return render;
}
