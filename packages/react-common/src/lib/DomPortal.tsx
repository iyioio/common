import { CSSProperties, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { EventCaptureContainer } from "./EventCaptureContainer";
import { DomPortalRenderTarget, domPortalRenderers } from "./dom-portal-lib";

export interface DomPortalProps
{
    children?:any;

    /**
     * A css selector that will be used to select the node to render the portal content to
     */
    targetSelector?:string;

    target?:Element|DocumentFragment;

    /**
     * Causes the portal to render inline. This is typically used for debugging or demonstration
     * purposes.
     */
    renderInline?:boolean;

    disabled?:boolean;

    /**
     * If true bubbling events will be captured. When true this will also cause the children to be
     * wrapped in a EventCaptureContainer
     */
    captureEvents?:boolean;

    captureContainerClassName?:string;

    captureContainerStyle?:CSSProperties;

    portalKey?:string;

    rendererId?:string;

    parentContainer?:Element;
}

/**
 * @acIgnore
 */
export function DomPortal({
    children,
    targetSelector,
    target,
    renderInline,
    disabled,
    captureEvents,
    captureContainerClassName,
    captureContainerStyle,
    portalKey,
    rendererId,
}:DomPortalProps){

    const [renderTarget,setRenderTarget]=useState<DomPortalRenderTarget|null>(null);
    useEffect(()=>{
        if(rendererId===undefined){
            return;
        }

        const sub=domPortalRenderers.subscribe(targets=>{
            setRenderTarget(targets.find(t=>t.id===rendererId)??null);
        })

        return ()=>{
            sub.unsubscribe();
        }

    },[rendererId]);

    const targetSelection=useMemo(()=>
        target??(targetSelector?
            (globalThis.document?.querySelector(targetSelector)??undefined):
            globalThis?.document?.body
        )
    ,[target,targetSelector]);

    const targetElem=rendererId?renderTarget?.node:targetSelection;

    if(disabled){
        return null;
    }

    if(captureEvents){
        children=(
            <EventCaptureContainer
                className={captureContainerClassName}
                style={captureContainerStyle}
            >
                {children}
            </EventCaptureContainer>
        )
    }

    if(renderInline){
        return children;
    }

    if(!targetElem){
        return null;
    }

    return createPortal(children,targetElem,portalKey)

}
