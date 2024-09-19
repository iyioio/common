import { useEffect, useMemo, useState } from "react";

/**
 * Returns a proxy of the given value if the value is an object. Any changes made to the returned
 * proxy will cause a re-render.
 */
export const useProxy=<T>(obj:T):T=>{
    const [,setRender]=useState(0);

    const proxy=useMemo(()=>{
        if(!obj || (typeof obj !=='object')){
            return {proxy:obj,revoke:null};
        }
        let iv:any;
        const queueChange=()=>{
            clearTimeout(iv);
            iv=setTimeout(()=>{
                setRender(v=>v+1);
            },1);
        }
        const proxy=Proxy.revocable(obj,{
            set:(target,prop,newValue,receiver)=>{
                if((obj as any)[prop]!==newValue){
                    queueChange();
                }
                return Reflect.set(target,prop,newValue,receiver);
            },
            deleteProperty:(target,prop)=>{
                if((obj as any)[prop]!==undefined){
                    queueChange();
                }
                return Reflect.deleteProperty(target,prop);
            },
        })
        return proxy;
    },[obj]);

    useEffect(()=>{
        if(!proxy.revoke){
            return;
        }
        return ()=>{
            proxy.revoke?.();
        }
    },[proxy])

    return proxy.proxy as any;
}
