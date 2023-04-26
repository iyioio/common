import { HashMap, initRootScope, isServerSide, rootScope, Scope, ScopeRegistration } from "@iyio/common";
import { useEffect, useRef, useState } from "react";
import { BaseLayoutStyleSheet, BaseLayoutStyleSheetProps } from "./BaseLayoutStyleSheet";
import { LockScreenRenderer } from "./LockScreenRenderer";
import { PortalRenderer } from "./PortalRenderer";

export interface BaseAppContainerProps
{
    children?:any;
    afterAll?:any;
    style?:BaseLayoutStyleSheetProps;
    scopeInit?:boolean|((reg:ScopeRegistration)=>void);
    onScopeInited?:(scope:Scope)=>void;
    scope?:Scope;
    initBeforeRender?:boolean;
    noPortalRenderer?:boolean;
    noBaseLayoutStyleSheet?:boolean;
    staticEnvVars?:HashMap<string>;
    useStaticEnvVarsInProduction?:boolean;
}

export function BaseAppContainer({
    children,
    style={},
    scopeInit,
    onScopeInited,
    scope=rootScope,
    initBeforeRender,
    noBaseLayoutStyleSheet,
    noPortalRenderer,
    staticEnvVars,
    afterAll,
}:BaseAppContainerProps){

    const stateRef=useRef({scopeInit,staticEnvVars});
    const [inited,setInited]=useState(false);

    useEffect(()=>{

        const {scopeInit,staticEnvVars}=stateRef.current;

        if(isServerSide || !scopeInit){
            return;
        }

        let m=true;
        setInited(false);

        if(!scope.initCalled()){
            initRootScope(reg=>{
                if(staticEnvVars){
                    reg.addParams(staticEnvVars);
                }
                if(typeof scopeInit === 'function'){
                    scopeInit(reg);
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
        {!noPortalRenderer && <>
            <PortalRenderer/>
            <LockScreenRenderer/>
        </>}
        {!noBaseLayoutStyleSheet && <BaseLayoutStyleSheet {...style}/>}
        {afterAll}
    </>)

}
