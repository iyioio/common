import { asArray, Point } from "@iyio/common";
import { useEffect, useId, useMemo } from "react";
import { BehaviorSubject } from "rxjs/internal/BehaviorSubject";
import { PortalProps, usePortal } from "../portal-lib";
import { ToolTipContainer } from "./ToolTipContainer";

export type ToolTipAlignment='start'|'center'|'end';

export interface ToolTipState{
    pt:Point;
    active:boolean;
    vAlign:ToolTipAlignment;
    hAlign:ToolTipAlignment;
    xOffset:number;
    yOffset:number;
    keepOnScreen:boolean;
}
export type ToolTipStateSubject=BehaviorSubject<ToolTipState>;

export interface ToolTipProps extends Omit<PortalProps,'active'>
{
    watch?:HTMLElement|HTMLElement[];
    vAlign?:ToolTipAlignment;
    hAlign?:ToolTipAlignment;
    xOffset?:number;
    yOffset?:number;
    keepOnScreen?:boolean;
}

export const useToolTip=({
    watch,
    children,
    vAlign='start',
    hAlign='center',
    xOffset=0,
    yOffset=0,
    keepOnScreen=false,
    ...props
}:ToolTipProps)=>{

    const state=useMemo<ToolTipStateSubject>(()=>new BehaviorSubject<ToolTipState>({
        pt:{x:0,y:0},
        active:false,
        vAlign:'start',
        hAlign:'center',
        xOffset:0,
        yOffset:0,
        keepOnScreen:false,
    }),[])

    const key=useId();

    const container=useMemo(()=><ToolTipContainer key={key} state={state}>{children}</ToolTipContainer>,[children,state,key])

    usePortal({...props,children:container});

    useEffect(()=>{

        const ary=asArray(watch??[]);

        if(!ary.length){
            return;
        }

        let m=true;

        const onMove=(e:MouseEvent)=>{
            if(!m){
                return;
            }
            state.next({
                ...state.value,
                pt:{
                    x:e.clientX,
                    y:e.clientY,
                },
                active:true
            })


        }

        const onOut=()=>{
            if(!m){
                return;
            }
            state.next({
                ...state.value,
                active:false
            })
        }

        for(const elem of ary){
            elem.addEventListener('mousemove',onMove);
            elem.addEventListener('mouseenter',onMove);
            elem.addEventListener('mouseover',onMove);
            elem.addEventListener('mouseleave',onOut);
            elem.addEventListener('mouseout',onOut);
        }


        return ()=>{
            m=false;
            for(const elem of ary){
                elem.removeEventListener('mousemove',onMove);
                elem.removeEventListener('mouseenter',onMove);
                elem.removeEventListener('mouseover',onMove);
                elem.removeEventListener('mouseleave',onOut);
                elem.removeEventListener('mouseout',onOut);
            }
        }



    },[watch,state]);

    useEffect(()=>{
        state.next({
            ...state.value,
            vAlign,
            hAlign,
            xOffset,
            yOffset,
            keepOnScreen,
        })
    },[state,vAlign,hAlign,xOffset,yOffset,keepOnScreen])
}
