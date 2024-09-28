import { Direction, Point } from "@iyio/common";
import { useEffect, useRef, useState } from "react";
import { DirectionInputCtrl } from "./direction-input/DirectionInputCtrl";
import { useDirectionInputCtrl } from "./direction-input/direction-input-lib";

export type SwipeDirection=Direction;

export type SwipeListener=(direction:SwipeDirection)=>void;

export const useSwipe=(listener?:SwipeListener|DirectionInputCtrl,swipeTimeout=2000,swipeDist=30):((listenTo:HTMLElement|null)=>void)=>
{
    const [listenTo,setListenTo]=useState<HTMLElement|null>(null);
    const dirCtrl=useDirectionInputCtrl();

    const stateRef=useRef({listener,swipeTimeout,swipeDist,dirCtrl});
    stateRef.current.listener=listener;
    stateRef.current.swipeTimeout=swipeTimeout;
    stateRef.current.swipeDist=swipeDist;
    stateRef.current.dirCtrl=dirCtrl;

    useEffect(()=>{

        if(!listenTo){
            return;
        }

        let posDown={x:0,y:0}
        let time=0;
        let useTouch:boolean|null=null;

        const touchDown=(e:TouchEvent)=>{
            useTouch=true;
            down({x:e.changedTouches[0]?.clientX??0,y:e.changedTouches[0]?.clientY??0})
        }

        const touchUp=(e:TouchEvent)=>{
            useTouch=true;
            up({x:e.changedTouches[0]?.clientX??0,y:e.changedTouches[0]?.clientY??0},e)
        }

        const mouseDown=(e:MouseEvent)=>{
            if(useTouch){
                return;
            }
            down({x:e.clientX,y:e.clientY})
        }

        const mouseUp=(e:MouseEvent)=>{
            if(useTouch){
                return;
            }
            up({x:e.clientX,y:e.clientY},e)
        }

        const down=(pt:Point)=>{
            time=Date.now();
            posDown={...pt};;
        }

        const up=(pt:Point,e:Event)=>{
            const {
                listener,
                swipeTimeout,
                swipeDist,
                dirCtrl
            }=stateRef.current;

            if(Date.now()-time>swipeTimeout){
                return;
            }

            const posUp={...pt}

            const xDiff=posUp.x-posDown.x;
            const yDiff=posUp.y-posDown.y;
            const xDiffAbs=Math.abs(xDiff);
            const yDiffAbs=Math.abs(yDiff);

            if(xDiffAbs<swipeDist && yDiffAbs<swipeDist){
                return;
            }

            e.preventDefault();

            const dir:Direction=(
                 xDiffAbs>yDiffAbs?
                    xDiff>0?'right':'left'
                :
                    yDiff>0?'down':'up'
            )

            dirCtrl?.triggerInput(dir);

            if(typeof listener==='function'){
                listener?.(dir);
            }else{
                listener?.triggerInput(dir);
            }

        }

        listenTo.addEventListener('touchstart',touchDown);
        listenTo.addEventListener('touchend',touchUp);
        listenTo.addEventListener('mousedown',mouseDown);
        listenTo.addEventListener('mouseup',mouseUp);

        return ()=>{
            listenTo.removeEventListener('touchstart',touchDown);
            listenTo.removeEventListener('touchend',touchUp);
            listenTo.removeEventListener('mousedown',mouseDown);
            listenTo.removeEventListener('mouseup',mouseUp);
        }

    },[listenTo])

    return setListenTo;
}
