import { removeOnUiReadyClassName, removeOnUiReadyDelayedClassName, uiReadyClassName, uiReadyDelayedClassName, uiReadyDelayedSubject, uiReadySubject } from "@iyio/common";
import { useEffect, useRef } from "react";
import { useSubject } from "./rxjs-hooks";

export const useUiReady=()=>{

    const ready=useSubject(uiReadySubject);
    const readyDelayed=useSubject(uiReadyDelayedSubject);


    useEffect(()=>{
        if(!ready){
            return;
        }

        const remove=document.querySelectorAll('.'+removeOnUiReadyClassName);
        for(let i=0;i<remove.length;i++){
            remove[i]?.remove();
        }

        document.body.classList.add(uiReadyClassName);

    },[ready])


    useEffect(()=>{
        if(!readyDelayed){
            return;
        }

        const remove=document.querySelectorAll('.'+removeOnUiReadyDelayedClassName);
        for(let i=0;i<remove.length;i++){
            remove[i]?.remove();
        }

        document.body.classList.add(uiReadyDelayedClassName);

    },[readyDelayed])
}

export const useTriggerUiReady=(ready:boolean,readyDelayMs=1,delayedMs=3000)=>{
    const delayRef=useRef({delayedMs,readyDelayMs});
    delayRef.current.delayedMs=delayedMs;
    delayRef.current.readyDelayMs=readyDelayMs;
    useEffect(()=>{
        if(!ready){
            return
        }
        let m=true;

        setTimeout(()=>{
            if(!m){
                return;
            }
            if(!uiReadySubject.value){
                uiReadySubject.next(true);
            }
            setTimeout(()=>{
                if(!m){
                    return;
                }
                if(!uiReadyDelayedSubject.value){
                    uiReadyDelayedSubject.next(true);
                }
            },delayRef.current.delayedMs);
        },delayRef.current.readyDelayMs);

        return ()=>{m=false}
    },[ready])
}
