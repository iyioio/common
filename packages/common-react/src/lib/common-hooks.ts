import { CancelToken } from "@iyio/common";
import { DependencyList, useCallback, useEffect, useId, useLayoutEffect, useMemo, useState } from "react";

export function useAlphaId(){
    return useId().replace(/\W/g,'_');
}

export function useAsync<T,D>(
    defaultValue:D,
    asyncCallback:(cancel:CancelToken)=>Promise<T>,
    errorMessage:string,
    deps:DependencyList,
    resetValueOnUpdate?:boolean):T|D
{
    const [value,setValue]=useState<T|D>(defaultValue);
    const cb=useCallback(asyncCallback,deps);// eslint-disable-line
    const cancel=useMemo(()=>new CancelToken(),[]);
    useLayoutEffect(()=>{
        return cancel.cancelNow;
    },[cancel]);

    useEffect(()=>{
        if(resetValueOnUpdate){
            setValue(defaultValue);
        }
        let active=true;
        const doCall=async ()=>{
            try{
                const r=await cb(cancel);
                if(active){
                    setValue(r);
                }
            }catch(ex){
                console.error(errorMessage,ex);
            }
        }
        doCall();
        return ()=>{
            active=false;
        }
    },[cb,cancel,errorMessage,resetValueOnUpdate,defaultValue])

    return value;
}
