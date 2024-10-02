import { SceneCtrl, SceneDescriptorProvider, isElementVisible } from "@iyio/common";
import { createContext, useContext, useEffect, useRef, useState } from "react";

export const SceneReactContext=createContext<SceneCtrl|null>(null);

export const useSceneCtrl=():SceneCtrl|null=>{
    return useContext(SceneReactContext);
}

export const useSceneDescriptor=(provider:SceneDescriptorProvider|null|undefined,visTest?:Element|null)=>{
    const ctrl=useSceneCtrl();
    const refs=useRef({provider,visTest});
    refs.current.provider=provider;
    refs.current.visTest=visTest;
    const hasProvider=!!provider;
    useEffect(()=>{
        if(!ctrl || !hasProvider){
            return;
        }
        const p=()=>{
            if(refs.current.visTest && !isElementVisible(refs.current.visTest)){
                return;
            }
            return refs.current.provider?.();
        }
        ctrl.addProvider(p);
        return ()=>{
            ctrl.removeProvider(p);
        }
    },[ctrl,hasProvider]);
}


export const useSceneDescriptorWithElem=(provider:SceneDescriptorProvider|null|undefined):((setElem:Element|null)=>void)=>{
    const [elem,setElem]=useState<Element|null>(null);
    useSceneDescriptor(elem?provider:undefined,elem??undefined);
    return setElem;
}
