import { useEffect, useRef, useState } from "react";
import { useShallowRef } from "./common-hooks";

export interface UseIntersectionObserverOptions
{
    onChange?:(visible:boolean)=>void;
}

export const useIntersectionObserver=(
    elem:HTMLElement|null,
    observerOptions?:IntersectionObserverInit,
    {
        onChange
    }:UseIntersectionObserverOptions={}
):boolean=>{

    const [visible,setVisible]=useState(false);

    const opts=useShallowRef(observerOptions);

    const onChangeRef=useRef(onChange);
    onChangeRef.current=onChange;

    useEffect(()=>{
        if(!elem){
            setVisible(false);
            return;
        }
        let visible:boolean|null=null;
        const observer=new IntersectionObserver((entries)=>{
            const e=entries[entries.length-1];
            if(!e){
                return;
            }
            if(e.isIntersecting!==visible){
                visible=e.isIntersecting;
                setVisible(e.isIntersecting);
                onChangeRef.current?.(e.isIntersecting);
            }
        },opts);
        observer.observe(elem);
        return ()=>{
            observer.unobserve(elem);
            observer.disconnect();
        }
    },[opts,elem]);

    return visible;
}
