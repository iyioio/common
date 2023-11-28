import { areShallowEqual, deepCompare } from "@iyio/common";
import { useEffect, useRef, useState } from "react";

/**
 * Caches a copy of item while the cached version of item deeply equals the current version
 */
export const useDeepCompareItem=<T>(item:T):T=>{

    const [value,setValue]=useState<T>(item);
    const ref=useRef(value);

    useEffect(()=>{
        if(deepCompare(item,ref.current)){
            return;
        }
        ref.current=item;
        setValue(item);
    },[item]);

    return value;
}

/**
 * Caches a copy of item while the cached version of item shallow equals the current version
 */
export const useShallowCompareItem=<T>(item:T):T=>{

    const [value,setValue]=useState<T>(item);
    const ref=useRef(value);

    useEffect(()=>{
        if(areShallowEqual(item,ref.current)){
            return;
        }
        ref.current=item;
        setValue(item);
    },[item]);

    return value;
}
