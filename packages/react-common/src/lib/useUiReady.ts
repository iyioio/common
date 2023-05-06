import { removeOnUiReadyClassName, removeOnUiReadyDelayedClassName, uiReadyClassName, uiReadyDelayedClassName, uiReadyDelayedSubject, uiReadySubject } from "@iyio/common";
import { useEffect } from "react";
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
