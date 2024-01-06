import { CSSProperties, useMemo } from "react";
import { createPortal } from "react-dom";
import { EventCaptureContainer } from "./EventCaptureContainer";

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
}

export function DomPortal({
    children,
    targetSelector,
    target,
    renderInline,
    disabled,
    captureEvents,
    captureContainerClassName,
    captureContainerStyle,
    portalKey
}:DomPortalProps){

    const targetElem=useMemo(()=>
        target??(targetSelector?
            (globalThis.document?.querySelector(targetSelector)??undefined):
            globalThis?.document?.body
        )
    ,[target,targetSelector])

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
