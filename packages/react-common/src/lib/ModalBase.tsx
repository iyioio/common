import { atDotCss } from "@iyio/at-dot-css";
import { BaseLayoutInnerProps, bcn, cn } from "@iyio/common";
import { useEffect, useState } from "react";
import { Portal } from "./Portal";
import { PortalProps } from "./portal-lib";

export interface ModalOpenCloseProps
{
    open:boolean;
    closeRequested?:(open:false)=>void;
}

export interface ModalBaseProps extends ModalOpenCloseProps, PortalProps, BaseLayoutInnerProps
{
    background?:string;
    /**
     * The number of milliseconds before the modal stops rending after open is set to false. This
     * timeout allows for transitions between open and closed.
     */
    renderTimeoutMs?:number;

    /**
     * If true the default transition is disabled. This is useful for creating custom transitions.
     */
    noDefaultTransition?:boolean;

    defaultShow?:boolean;
    center?:boolean;
    scrollable?:boolean;
    contentClassName?:string;
    bgClassName?:string;
    zIndex?:number;
    hideScrollBarOnOut?:boolean;
    keepMounted?:boolean;
}

export function ModalBase({
    rendererId,
    open,
    closeRequested,
    children,
    background,
    renderTimeoutMs=1000,
    noDefaultTransition,
    defaultShow=false,
    center,
    scrollable,
    bgClassName,
    contentClassName,
    hideScrollBarOnOut=true,
    zIndex,
    keepMounted,
    renderInline,
    ...props
}:ModalBaseProps){

    const [show,setShow]=useState(defaultShow);

    useEffect(()=>{
        if(open){
            setShow(true);
            return;
        }

        let m=true;

        setTimeout(()=>{
            if(m){
                setShow(false);
            }
        },renderTimeoutMs);

        return ()=>{
            m=false;
        }
    },[renderTimeoutMs,open])

    style.root();

    if(!show && !keepMounted){
        return null;
    }

    return (
        <>
            <Portal rendererId={rendererId} renderInline={renderInline}>
                <div style={{zIndex}} className={bcn(
                    props,
                    'ModelBase',
                    open?'ModelBase-open':'ModelBase-closed',
                    !show&&'hidden',
                    noDefaultTransition?undefined:(open?'ModelBase-defaultIn':'ModelBase-defaultOut'),
                    {center,scrollable,hideScrollBarOnOut,renderInline}
                )}>

                    <div className={cn("ModelBase-bg",bgClassName)} style={{background}} onClick={()=>closeRequested?.(false)}/>

                    <div className={cn("ModelBase-content",contentClassName)}>
                        {children}
                    </div>
                </div>
            </Portal>
        </>
    )

}

const style=atDotCss({name:'ModalBase',order:'frameworkHigh',css:`
    .ModelBase, .ModelBase-bg{
        position:absolute;
        left:0;
        right:0;
        top:0;
        bottom:0;
    }
    .ModelBase-content{
        position:relative;
        display:flex;
        flex-direction:column;
        height:100%;
    }
    .ModelBase.center .ModelBase-content{
        justify-content:center;
        align-items:center;
    }
    .ModelBase.scrollable .ModelBase-content{
        overflow-y:auto;
        overflow-y:overlay;
    }
    .ModelBase-closed.hideScrollBarOnOut.scrollable .ModelBase-content{
        overflow-y:hidden;
        overflow-y:clip;
    }
    .ModelBase.hidden{
        display:none;
    }


    @keyframes ModelBase-defaultIn{
        0%{opacity:0;}
        100%{opacity:1;}
    }
    @keyframes ModelBase-defaultOut{
        0%{opacity:1;}
        100%{opacity:0;}
    }
    @keyframes ModelBase-defaultIn-content{
        0%{transform:scale(1.1);}
        100%{transform:scale(1);}
    }
    @keyframes ModelBase-defaultOut-content{
        0%{transform:scale(1);}
        100%{transform:scale(0.9);}
    }

    .ModelBase-defaultIn{
        animation:ModelBase-defaultIn 0.5s forwards;
    }
    .ModelBase-defaultOut{
        animation:ModelBase-defaultOut 0.5s forwards;
    }

    .ModelBase-defaultIn .ModelBase-content{
        animation:ModelBase-defaultIn-content 0.5s forwards;
    }
    .ModelBase-defaultOut .ModelBase-content{
        animation:ModelBase-defaultOut-content 0.5s forwards;
    }

`});
