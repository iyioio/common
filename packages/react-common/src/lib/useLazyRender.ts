import { Size } from "@iyio/common";
import { useEffect, useState } from "react";
import { useIntersectionObserver } from "./useIntersectionObserver.js";

export interface UseLazyRenderOptions
{
    hold?:boolean;
    holdHeight?:boolean;
    holdWidth?:boolean;
    holdSize?:boolean;
    intersectionOptions?:IntersectionObserverInit;
}

export interface LazyRenderState
{
    show:boolean;
    minWidth:number|undefined;
    minHeight:number|undefined;
    hasBeenVisible:boolean;
}

export function useLazyRender(elem:HTMLElement|null,{
    hold,
    holdSize,
    holdHeight=holdSize,
    holdWidth=holdSize,
    intersectionOptions,
}:UseLazyRenderOptions={}):LazyRenderState{

    const [lastSize,setLastSize]=useState<Size|null>(null);

    const visible=useIntersectionObserver(elem,intersectionOptions);
    const [hasBeenVisible,setHasBeenVisible]=useState(visible);
    const [show,setShow]=useState(visible);
    useEffect(()=>{
        const show=hold?hasBeenVisible:visible;
        if(!show && elem){
            setLastSize({
                width:elem.clientWidth,
                height:elem.clientHeight,
            })
        }
        setShow(show)
    },[hold,visible,hasBeenVisible,elem]);
    useEffect(()=>{
        if(visible){
            setHasBeenVisible(true);
        }
    },[visible]);

    return {
        show,
        minWidth:show?undefined:holdWidth?lastSize?.width:undefined,
        minHeight:show?undefined:holdHeight?lastSize?.height:undefined,
        hasBeenVisible,
    }

}
