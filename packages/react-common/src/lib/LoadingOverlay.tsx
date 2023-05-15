import { cn, css } from "@iyio/common";
import Style from "styled-jsx/style";
import { LoadingIndicator } from "./LoadingIndicator";
import { Text } from './Text';
import { useDelayedValue } from "./useDelayedValue";

interface LoadingOverlayProps
{
    disabled?:boolean;
    message?:string;
    children?:any;
}

export function LoadingOverlay({
    disabled,
    message,
    children
}:LoadingOverlayProps){

    const hide=useDelayedValue(disabled,500,true);

    return (
        <div className={cn("LoadingOverlay",{disabled})}>

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
                    transition:opacity 0.2s ease-in-out;
                    background-color:#00000055;
                    backdrop-filter:blur(4px);
                }
                .LoadingOverlay.disabled{
                    opacity:0;
                    pointer-events:none;
                }
            `}</Style>
        </div>
    )

}
