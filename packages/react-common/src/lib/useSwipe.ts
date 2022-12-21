import { useEffect, useRef, useState } from "react";

export type SwipeDirection='up'|'down'|'left'|'right';

export type SwipeListener=(direction:SwipeDirection)=>void;

export const useSwipe=(listener?:SwipeListener,swipeTimeout=2000,swipeDist=30):((listenTo:HTMLElement|null)=>void)=>
{
    const [listenTo,setListenTo]=useState<HTMLElement|null>(null);

    const stateRef=useRef({listener,swipeTimeout,swipeDist});
    stateRef.current.listener=listener;
    stateRef.current.swipeTimeout=swipeTimeout;
    stateRef.current.swipeDist=swipeDist;

    useEffect(()=>{

        if(!listenTo){
            return;
        }

        let posDown={x:0,y:0}
        let time=0;

        const down=(e:TouchEvent)=>{
            time=Date.now();
            posDown={x:e.changedTouches[0].clientX,y:e.changedTouches[0].clientY};
        }

        const up=(e:TouchEvent)=>{
            const {
                listener,
                swipeTimeout,
                swipeDist
            }=stateRef.current;

            if(Date.now()-time>swipeTimeout){
                return;
            }

            const posUp={x:e.changedTouches[0].clientX,y:e.changedTouches[0].clientY};

            const xDiff=posUp.x-posDown.x;
            const yDiff=posUp.y-posDown.y;
            const xDiffAbs=Math.abs(xDiff);
            const yDiffAbs=Math.abs(yDiff);

            if(xDiffAbs<swipeDist && yDiffAbs<swipeDist){
                return;
            }

            e.preventDefault();

            listener?.(
                xDiffAbs>yDiffAbs?
                    xDiff>0?'right':'left'
                :
                    yDiff>0?'down':'up'
            )
            
        }

        listenTo.addEventListener('touchstart',down);
        listenTo.addEventListener('touchend',up);

        return ()=>{
            listenTo.removeEventListener('touchstart',down);
            listenTo.removeEventListener('touchend',up);
        }

    },[listenTo])

    return setListenTo;
}