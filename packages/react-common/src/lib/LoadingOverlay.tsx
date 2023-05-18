import { cn, css } from "@iyio/common";
import { CSSProperties } from "react";
import Style from "styled-jsx/style";
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
}

export function LoadingOverlay({
    disabled:_disabled=false,
    message,
    children,
    zIndex,
    backgroundColor,
    transitionLengthMs=500,
    delayMs=0,
    style={}
}:LoadingOverlayProps){

    const startDelay=useDelayedValue(true,delayMs,undefined,false);


    const disabled=(!!delayMs && !startDelay) || _disabled;

    const hide=useDelayedValue(disabled,transitionLengthMs+1000,false);

    return (
        <div className={cn("LoadingOverlay",{disabled})} style={{
            zIndex,
            backgroundColor,
            transition:`opacity ${transitionLengthMs}ms ease-in-out`,
            ...style
        }}>

            {!hide && <>
                <LoadingIndicator />
                <Text face2 text={message} />
                {children}
            </>}

            <Style id="LoadingOveraly-4nJ8yYIQwESaJddaNKSc" global jsx>{css`
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
            `}</Style>
        </div>
    )

}
