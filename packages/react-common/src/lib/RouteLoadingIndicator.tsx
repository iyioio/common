import { cn, css, uiRouterService } from "@iyio/common";
import { useEffect, useRef, useState } from "react";
import Style from "styled-jsx/style";
import { View } from "./View";
import { useSubject } from "./rxjs-hooks";

export interface RouteLoadingIndicatorProps
{
    children?:any;
    color?:string;
    height?:string;
    enableDebugging?:boolean;
    childrenShowDelayMs?:number;
    childrenFadeInDurationMs?:number;
    duration?:number;
    zIndex?:number;
}

export function RouteLoadingIndicator({
    children,
    color='#00ff00',
    height='3px',
    enableDebugging,
    childrenShowDelayMs=2000,
    childrenFadeInDurationMs=600,
    duration=1000,
    zIndex=10000,
}:RouteLoadingIndicatorProps)
{

    const isLoading=useSubject(uiRouterService().isLoadingSubject);

    const [showOverlay,setShowOverlay]=useState(false);
    const [closeOverlay,setCloseOverlay]=useState(false);
    const [bar,setBar]=useState<HTMLElement|null>(null);
    const anRef=useRef<Animation|null>(null);
    useEffect(()=>{

        if(!bar){
            return;
        }

        setCloseOverlay(false);

        if(!isLoading){
            setShowOverlay(false);
            return;
        }

        let m=true;

        anRef.current?.cancel();

        const an=bar.animate([
            {offset:0,transform:'scaleX(0)'},
            {offset:0.6,opacity:1},
            {offset:1,transform:'scaleX(1)',opacity:0},
        ],{
            easing:'ease-in-out',
            duration:duration,
        });
        an.addEventListener('finish',()=>{
            if(!m){
                an.cancel();
                return;
            }
            an.play();
        })
        anRef.current=an;

        setTimeout(()=>{
            if(m){
                setShowOverlay(true);
            }
        },childrenShowDelayMs)

        return ()=>{
            m=false;
        }

    },[isLoading,bar,childrenShowDelayMs,duration]);

    return (
        <>

            {!!children && <View
                roleNone
                col
                className={cn("RouteLoadingIndicator-overlay",{isLoading:(showOverlay || enableDebugging) && !closeOverlay})}
                style={{
                    zIndex,
                    transition:`opacity ${childrenFadeInDurationMs}ms ease-in-out`,
                }}
            >
                {children}
            </View>}

            <div
                role="none"
                className={cn("RouteLoadingIndicator",{isLoading:isLoading || enableDebugging})}
                style={{
                    transition:`opacity ${childrenShowDelayMs}ms ease-in-out`,
                    zIndex,
                }}
            >
                <div
                    ref={setBar}
                    className="RouteLoadingIndicator-bar"
                    style={{
                        backgroundColor:color,
                        height:height,
                    }}
                />
            </div>

            <Style id="RouteLoadingIndicator-VVCH9Q2aQCTKuSeB2zSq" global jsx>{css`
                .RouteLoadingIndicator{
                    position:absolute;
                    left:0;
                    right:0;
                    top:0;
                    pointer-events:none;
                    opacity:1;
                }
                .RouteLoadingIndicator.isLoading{
                    opacity:1;
                }
                .RouteLoadingIndicator-bar{
                    position:absolute;
                    left:0;
                    top:0;
                    width:100%;
                    transform-origin:0 0;
                    transform:translateX(0) scaleX(0);
                }
                .RouteLoadingIndicator-overlay{
                    position:absolute;
                    left:0;
                    right:0;
                    width:100%;
                    height:100%;
                    z-index:20;
                    pointer-events:none;
                    opacity:0;
                }
                .RouteLoadingIndicator-overlay.isLoading{
                    opacity:1;
                    pointer-events:auto;
                }
            `}</Style>
        </>
    )

}
