import { useEffect, useState } from "react";

export const useDelayedValue=<T>(value:T,delayMs:number,noDelayFor?:T):T=>{

    const [val,setVal]=useState(value);

    useEffect(()=>{
        if(value===noDelayFor){
            setVal(value);
            return;
        }
        let m=true;

        setTimeout(()=>{
            if(m){
                setVal(value);
            }
        },delayMs)

        return ()=>{
            m=false;
        }
    },[value,delayMs,noDelayFor])

    return val;
}
