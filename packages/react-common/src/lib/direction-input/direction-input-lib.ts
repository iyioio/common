import { Direction } from "@iyio/common";
import { createContext, useContext, useEffect, useMemo, useRef } from "react";
import { useSubject } from "../rxjs-hooks.js";
import { DirectionInputCtrl } from "./DirectionInputCtrl.js";

export const DirectionInputReactContext=createContext<DirectionInputCtrl|null>(null);

export const useCreateDirectionInputCtrl=()=>{
    const existing=useDirectionInputCtrl();
    return useMemo(()=>existing??new DirectionInputCtrl(),[existing]);
}

export const useDirectionInputCtrl=()=>{
    return useContext(DirectionInputReactContext);
}

export const useDirectionInput=(callback:(direction:Direction)=>void,ctrl?:DirectionInputCtrl)=>{
    const _ctrl=useDirectionInputCtrl();
    const ref=useRef(callback);
    ref.current=callback
    const c=ctrl??_ctrl;

    useEffect(()=>{
        if(!c){
            return;
        }

        const sub=c.onDirectionInput.subscribe(dir=>{
            ref.current?.(dir);
        });
        return ()=>{
            sub.unsubscribe();
        }
    },[c]);
}

export const useDirectionIndexRequest=(callback:(index:number)=>void,ctrl?:DirectionInputCtrl)=>{
    const _ctrl=useDirectionInputCtrl();
    const ref=useRef(callback);
    ref.current=callback
    const c=ctrl??_ctrl;

    useEffect(()=>{
        if(!c){
            return;
        }

        const sub=c.onIndexRequested.subscribe(i=>{
            ref.current?.(i);
        });
        return ()=>{
            sub.unsubscribe();
        }
    },[c]);
}

export const useDirectionIndex=(index?:number,ctrl?:DirectionInputCtrl):number=>{

    const _ctrl=useDirectionInputCtrl();
    const c=ctrl??_ctrl;

    const i=useSubject(c?.indexSubject);

    useEffect(()=>{
        if(c && index!==undefined){
            c.index=index;
        }
    },[c,index]);

    return i??index??0;
}

export const useDirectionCount=(count?:number,ctrl?:DirectionInputCtrl):number=>{

    const _ctrl=useDirectionInputCtrl();
    const c=ctrl??_ctrl;

    const i=useSubject(c?.countSubject);

    useEffect(()=>{
        if(c && count!==undefined){
            c.count=count;
        }
    },[c,count]);

    return i??count??0;
}
