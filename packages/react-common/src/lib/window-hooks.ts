import { BreakpointDetails, BreakpointWatcher, getDefaultBreakpointWatcher, getWindowSize, Size } from "@iyio/common";
import { useEffect, useState } from "react";
import { useSubject } from "./rxjs-hooks.js";

export const useWindowSize=():Size=>{

    const [size,setSize]=useState<Size>(getWindowSize());

    useEffect(()=>{

        if(!globalThis.window){
            return;
        }

        let m=true;

        const listener=()=>{
            if(m){
                setSize(getWindowSize());
            }
        }

        globalThis.window.addEventListener('resize',listener);

        return ()=>{
            m=false;
            globalThis.window.removeEventListener('resize',listener);
        }

    },[])

    return size;
}

export const useWindowWidth=():number=>{
    return useWindowSize().width;
}

export const useWindowHeight=():number=>{
    return useWindowSize().height;
}

export const useBreakpoints=(watcher:BreakpointWatcher=getDefaultBreakpointWatcher()):BreakpointDetails=>{
    return useSubject(watcher.detailsSubject);
}
