import { BaseLayoutInnerProps } from "@iyio/common";
import { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView } from "../ScrollView";
import { View } from "../View";
import { useSubject } from "../rxjs-hooks";
import { SurfaceCtrl } from "./SurfaceCtrl";
import { viewportStyle } from "./Viewport";
import { SurfaceCtrlReactContext, useViewportCtrl } from "./viewport-lib";

export interface SurfaceProps
{
    index:number;
    scroll?:boolean;
    clip?:boolean;
    onFocus?:()=>void;
    onBlur?:()=>void;
    children?:any;
}

export function Surface({
    index,
    scroll,
    clip,
    children,
    onFocus,
    onBlur,
    ...props
}:SurfaceProps & BaseLayoutInnerProps){

    const refs=useRef({onFocus,onBlur,beenActive:false});
    refs.current.onFocus=onFocus;
    refs.current.onBlur=onBlur;

    const [elem,setElem]=useState<HTMLElement|null>(null);

    const ctrl=useMemo(()=>elem?new SurfaceCtrl(index,elem):null,[index,elem]);

    const vpCtrl=useViewportCtrl();
    const activeIndex=useSubject(vpCtrl?.indexSubject);

    const active=index===activeIndex;

    useEffect(()=>{
        if(ctrl){
            ctrl.active=active;
        }
    },[active,ctrl]);

    useEffect(()=>{
        if(!vpCtrl || !ctrl){
            return;
        }
        vpCtrl.addSurface(ctrl);
        return ()=>{
            vpCtrl.removeSurface(ctrl);
        }
    },[ctrl,vpCtrl]);

    useEffect(()=>{
        if(active){
            refs.current.beenActive=true;
            refs.current.onFocus?.();
        }else if(refs.current.beenActive){
            refs.current.onBlur?.();
        }
    },[active]);

    if(scroll){
        children=(
            <ScrollView flex1 containerCol containerFill>
                {children}
            </ScrollView>
        )
    }

    return (
        <SurfaceCtrlReactContext.Provider value={ctrl}>
            <div
                ref={setElem}
                className={viewportStyle.stage({active,clip})}
                style={viewportStyle.vars({stageIndex:index})}
            >
                <View col flex1 {...props}>
                    {activeIndex===undefined || Math.abs(index-activeIndex)<=1?children:null}
                </View>
            </div>
        </SurfaceCtrlReactContext.Provider>
    )

}
