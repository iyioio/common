import { atDotCss } from "@iyio/at-dot-css";
import { Direction, DisposeCallback, Point } from "@iyio/common";
import { useEffect, useRef, useState } from "react";
import { DirectionInputCtrl } from "./direction-input/DirectionInputCtrl";
import { useDirectionInputCtrl } from "./direction-input/direction-input-lib";

export type SwipeDirection=Direction;

export type SwipeListener=(direction:SwipeDirection)=>void;

export const useSwipe=(
    listener?:SwipeListener|DirectionInputCtrl,
    swipeTimeout=2000,
    swipeDist=30,
    listenToElem?:HTMLElement|null
):((listenTo:HTMLElement|null)=>void)=>{

    const [listenTo,setListenTo]=useState<HTMLElement|null>(listenToElem??null);
    const dirCtrl=useDirectionInputCtrl();

    useEffect(()=>{
        if(listenToElem!==undefined){
            setListenTo(listenToElem);
        }
    },[listenToElem]);

    const stateRef=useRef({listener,swipeTimeout,swipeDist,dirCtrl});
    stateRef.current.listener=listener;
    stateRef.current.swipeTimeout=swipeTimeout;
    stateRef.current.swipeDist=swipeDist;
    stateRef.current.dirCtrl=dirCtrl;

    useEffect(()=>{

        if(!listenTo){
            return;
        }

        style.root();

        let posDown={x:0,y:0}
        let time=0;
        let useTouch:boolean|null=null;
        let isMoving=false;
        let moveId=0;
        let moveCleanupIv:any;
        let moveCleanup:DisposeCallback|undefined;

        const touchDown=(e:TouchEvent)=>{
            useTouch=true;
            down({x:e.changedTouches[0]?.clientX??0,y:e.changedTouches[0]?.clientY??0})
        }

        const touchMove=(e:TouchEvent)=>{
            if(isMoving || Date.now()-time>swipeTimeout){
                return;
            }
            move({x:e.changedTouches[0]?.clientX??0,y:e.changedTouches[0]?.clientY??0});
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

        const mouseMove=(e:MouseEvent)=>{
            if(useTouch || isMoving || Date.now()-time>swipeTimeout){
                return;
            }
            move({x:e.clientX,y:e.clientY});
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
            moveCleanup?.();
            const {
                listener,
                swipeTimeout,
                swipeDist,
                dirCtrl
            }=stateRef.current;

            if(Date.now()-time>swipeTimeout){
                time=0;
                return;
            }
            time=0;

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

        const move=(pt:Point)=>{
            const xDiff=pt.x-posDown.x;
            const yDiff=pt.y-posDown.y;
            const xDiffAbs=Math.abs(xDiff);
            const yDiffAbs=Math.abs(yDiff);

            if(xDiffAbs<swipeDist && yDiffAbs<swipeDist){
                return;
            }
            moveCleanup?.();

            isMoving=true;
            listenTo.classList.add(style.swiping());
            const mId=++moveId;

            let disposed=false;
            const cleanup=()=>{
                clearTimeout(moveCleanupIv);
                if(disposed || moveId!==mId){
                    return;
                }
                disposed=true;
                isMoving=false;
                listenTo.classList.remove(style.swiping());
                moveCleanup=undefined;
            }
            moveCleanup=cleanup;
            moveCleanupIv=setTimeout(cleanup,swipeTimeout+100);

        }

        listenTo.addEventListener('touchstart',touchDown);
        listenTo.addEventListener('touchend',touchUp);
        listenTo.addEventListener('mousedown',mouseDown);
        listenTo.addEventListener('mouseup',mouseUp);
        listenTo.addEventListener('mousemove',mouseMove);
        listenTo.addEventListener('touchmove',touchMove);

        return ()=>{
            listenTo.removeEventListener('touchstart',touchDown);
            listenTo.removeEventListener('touchend',touchUp);
            listenTo.removeEventListener('mousedown',mouseDown);
            listenTo.removeEventListener('mouseup',mouseUp);
            listenTo.removeEventListener('mousemove',mouseMove);
            listenTo.removeEventListener('touchmove',touchMove);
        }

    },[listenTo])

    return setListenTo;
}

const style=atDotCss({name:'useSwipe',namespace:'iyio',order:'framework',css:`
    @.swiping > *{
        pointer-events:none !important;
    }

`});
