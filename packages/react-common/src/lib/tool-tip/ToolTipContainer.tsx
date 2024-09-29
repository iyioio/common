import { atDotCss } from "@iyio/at-dot-css";
import { useEffect, useState } from "react";
import type { ToolTipStateSubject } from "./tool-tip-lib";

export interface ToolTipContainerProps
{
    state:ToolTipStateSubject;
    children:any;
}

/**
 * @acIgnore
 */
export function ToolTipContainer({
    state,
    children,
}:ToolTipContainerProps){

    const [elem,setElem]=useState<HTMLDivElement|null>(null);
    const [inner,setInner]=useState<HTMLDivElement|null>(null);

    useEffect(()=>{

        if(!elem || !inner){
            return;
        }

        let hasBeenActive=false;

        const sub=state.subscribe(({active,pt,vAlign,hAlign,xOffset,yOffset,keepOnScreen})=>{
            if(active){
                hasBeenActive=true;
            }
            if(active || (hasBeenActive && keepOnScreen)){
                elem.classList.add('active');
            }else{
                elem.classList.remove('active');
            }
            elem.style.transform=`translate(${pt.x}px,${pt.y}px)`;

            inner.style.transform=`translate(${
                hAlign==='start'?'0':hAlign==='center'?'-50%':'-100%'
            },${
                vAlign==='start'?'0':vAlign==='center'?'-50%':'-100%'
            }) translate(${xOffset}px,${yOffset}px)`
        });

        return ()=>{
            sub.unsubscribe();
        }

    },[elem,state,inner]);

    style.root();

    return (
        <div ref={setElem} className="ToolTipContainer">
            <div ref={setInner}>
                {children}
            </div>
        </div>
    )

}


const style=atDotCss({name:'ToolTipContainer',order:'frameworkHigh',css:`
    .ToolTipContainer{
        pointer-events:none;
        opacity:0;
        transition:opacity 0.2s ease-in-out;
        position:fixed;
        left:0;
        top:0;
        overflow:visible;
        z-index:10000;
    }
    .ToolTipContainer.active{
        opacity:1;
    }
`});
