import { ElementSizeObserver, Size } from "@iyio/common";
import { useEffect, useState } from "react";

export const useElementSize=(e?:Element|null):[Size,(elem:Element|null|undefined)=>void,Element|null]=>{

    const [elem,setElem]=useState<Element|null|undefined>(e??null);
    const [size,setSize]=useState<Size>({width:0,height:0});

    useEffect(()=>{
        if(e!==undefined){
            setElem(e);
        }
    },[e]);

    useEffect(()=>{
        if(!elem){
            setSize({width:0,height:0});
            return;
        }
        const ob=new ElementSizeObserver(elem);

        const sub=ob.sizeSubject.subscribe(setSize);

        return ()=>{
            sub.unsubscribe();
            ob.dispose();
        }
    },[elem])

    return [size,setElem,elem??null];
}
