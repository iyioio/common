import { useEffect, useState } from "react";
import { useShallowRef } from "./common-hooks";

export const useIntersectionObserver=(elem:HTMLElement|null,options?:IntersectionObserverInit):boolean=>
{

    const [visible,setVisible]=useState(false);

    const [observer,setObserver]=useState<IntersectionObserver|null>(null);

    const opts=useShallowRef(options);

    useEffect(()=>{
        let visible:boolean|null=null;
        const observer=new IntersectionObserver((entries)=>{
            for(const e of entries){
                if(e.isIntersecting!==visible){
                    visible=e.isIntersecting;
                    setVisible(e.isIntersecting);
                }
                break;
            }
        },opts);
        setObserver(observer);
        return ()=>{
            observer.disconnect();
        }
    },[opts]);

    useEffect(()=>{
        if(!elem || !observer){
            return;
        }
        observer.observe(elem);
        return ()=>{
            observer.unobserve(elem);
        }
    },[elem,observer]);

    return visible;
}
