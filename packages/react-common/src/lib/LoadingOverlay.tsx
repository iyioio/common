import { atDotCss } from "@iyio/at-dot-css";
import { cn } from "@iyio/common";
import { CSSProperties } from "react";
import { LoadingIndicator } from "./LoadingIndicator";
import { Text } from './Text';
import { useDelayedValue } from "./useDelayedValue";

interface LoadingOverlayProps
{
    disabled?:boolean;
    message?:string;
    children?:any;
    zIndex?:number;
    backgroundColor?:string;

    /**
     * The length of the fade transition that hides and shows the overlay
     */
    transitionLengthMs?:number;
    /**
     * Delays the showing of the overlay by the number of specified milliseconds
     */
    delayMs?:number;

    style?:CSSProperties;

    delayIndictor?:boolean;
}

export function LoadingOverlay({
    disabled:_disabled=false,
    message,
    children,
    zIndex,
    backgroundColor,
    transitionLengthMs=500,
    delayMs=0,
    delayIndictor,
    style:styleProp={}
}:LoadingOverlayProps){

    const startDelay=useDelayedValue(true,delayMs,undefined,false);


    const disabled=(!!delayMs && !startDelay) || _disabled;

    const hide=useDelayedValue(disabled,transitionLengthMs+1000,false);

    style.root();

    return (
        <div className={cn("LoadingOverlay",{disabled,delayIndictor})} style={{
            zIndex,
            backgroundColor,
            transition:`opacity ${transitionLengthMs}ms ease-in-out`,
            ...styleProp
        }}>

            {!hide && <>
                <LoadingIndicator />
                <Text face2 text={message} />
                {children}
            </>}
        </div>
    )

}

const style=atDotCss({name:'LoadingOverlay',order:'frameworkHigh',css:`
    .LoadingOverlay{
        display:flex;
        flex-direction:column;
        justify-content:center;
        gap:1rem;
        align-items:center;
        position:absolute;
        left:0;
        top:0;
        width:100%;
        height:100%;
        background-color:#00000055;
        backdrop-filter:blur(4px);
        z-index:10;
    }
    .LoadingOverlay.disabled{
        opacity:0;
        pointer-events:none;
    }
    @keyframes LoadingOverlay-delayIndicator{
        0%{opacity:0}
        50%{opacity:0}
        100%{opacity:0}
    }
    .LoadingOverlay.delayIndictor .LoadingIndicator{
        animation:LoadingOverlay-delayIndicator 2s;
    }
`});
