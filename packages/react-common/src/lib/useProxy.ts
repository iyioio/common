import { ProxyChangeDetector } from "@iyio/common";
import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Returns a proxy of the given value if the value is an object. Any changes made to the returned
 * proxy will cause a re-render.
 */
export const useProxy=<T>(obj:T,useInitValue=false,maxDepth=1):T=>{
    const initRef=useRef(obj);
    const [,setRender]=useState(0);

    const _obj=useInitValue?null:obj;

    const proxy=useMemo(()=>{

        const obj=useInitValue?initRef.current:_obj;

        if(!obj || (typeof obj!=='object')){
            return null;
        }

        let iv:any;
        const listener=()=>{
            clearTimeout(iv);
            iv=setTimeout(()=>{
                setRender(v=>v+1);
            },1);
        }

        return new ProxyChangeDetector({
            target:obj,
            maxDepth,
            listener,
        })

    },[_obj,maxDepth,useInitValue]);

    useEffect(()=>{
        if(!proxy){
            return;
        }
        return ()=>{
            proxy.dispose();
        }
    },[proxy])

    return proxy?.proxy??_obj;
}
