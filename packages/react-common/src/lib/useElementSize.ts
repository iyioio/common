import { ElementSizeObserver, Size } from "@iyio/common";
import { useLayoutEffect, useState } from "react";

export const useElementSize=():[Size,(elem:Element|null|undefined)=>void]=>{

    const [elem,setElem]=useState<Element|null|undefined>(null);
    const [size,setSize]=useState<Size>({width:0,height:0});

    useLayoutEffect(()=>{
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

    return [size,setElem];
}
