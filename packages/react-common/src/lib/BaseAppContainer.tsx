import { initRootScope, isServerSide, rootScope, Scope, ScopeRegistration } from "@iyio/common";
import { useEffect, useRef, useState } from "react";
import { BaseLayoutStyleSheet, BaseLayoutStyleSheetProps } from "./BaseLayoutStyleSheet";
import { PortalRenderer } from "./PortalRenderer";

export interface BaseAppContainerProps
{
    children?:any;
    style?:BaseLayoutStyleSheetProps;
    scopeInit?:boolean|((reg:ScopeRegistration)=>void);
    onScopeInited?:(scope:Scope)=>void;
    scope?:Scope;
    initBeforeRender?:boolean;
    noPortalRenderer?:boolean;
    noBaseLayoutStyleSheet?:boolean;
}

export function BaseAppContainer({
    children,
    style={},
    scopeInit,
    onScopeInited,
    scope=rootScope,
    initBeforeRender,
    noBaseLayoutStyleSheet,
    noPortalRenderer
}:BaseAppContainerProps){

    const scopeInitRef=useRef(scopeInit);
    const [inited,setInited]=useState(false);

    useEffect(()=>{
        if(isServerSide || !scopeInitRef.current){
            return;
        }

        let m=true;
        setInited(false);

        if(!scope.initCalled()){
            initRootScope(reg=>{
                if(typeof scopeInitRef.current === 'function'){
                    scopeInitRef.current(reg);
                }
            })
        }

        scope.getInitPromise().then(()=>{
            if(m){
                setInited(true);
            }
        })

        return ()=>{
            m=false;
        }
    },[scope])

    useEffect(()=>{
        if(inited){
            onScopeInited?.(scope);
        }
    },[inited,onScopeInited,scope])

    if(initBeforeRender && !inited){
        return null;
    }

    return (<>
        {children}
        {!noPortalRenderer && <PortalRenderer/>}
        {!noBaseLayoutStyleSheet && <BaseLayoutStyleSheet {...style}/>}
    </>)

}
