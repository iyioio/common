import { Point } from "@iyio/common";
import { createContext, MouseEvent, TouchEvent, useCallback, useContext, useEffect, useMemo, useRef, useState, WheelEvent } from "react";
import { BehaviorSubject } from "rxjs";

export interface DragTarget{
    selector?:(elem:Element)=>boolean;
    className?:string;
    targetParentClass?:string;
    skipSetTransform?:boolean;
    onEnd?:(pt:Point,elem:HTMLElement)=>void;
    onMove?:(pt:Point,elem:HTMLElement)=>void;
}

export interface PanZoomViewProps
{
    children?:any;
    minScale?:number;
    maxScale?:number;
    initState?:PanZoomState;
    getCtrl?:(ctrl:PanZoomCtrl)=>void;
    /**
     * class names of elements to ignore touches from
     */
    ignoreClasses?:string|string[];

    /**
     * Acts as a filter to ignore touches from elements
     */
    ignore?:(elem:Element)=>boolean;

    dragTargets?:DragTarget[];
}


export function PanZoomView({
    children,
    minScale=0.1,
    maxScale=3,
    initState,
    getCtrl,
    ignoreClasses,
    ignore,
    dragTargets,
}:PanZoomViewProps){


    const initRef=useRef(initState);

    const ctrl=useMemo(()=>new PanZoomCtrl(initRef.current),[]);
    const [plane,setPlane]=useState<HTMLDivElement|null>(null);
    useEffect(()=>{
        if(!plane){
            return;
        }

        const sub=ctrl.state.subscribe(v=>{
            plane.style.transform=`translate(${v.x}px,${v.y}px) scale(${v.scale})`;
        })

        return ()=>{
            sub.unsubscribe();
        }

    },[ctrl,plane]);

    useEffect(()=>{
        getCtrl?.(ctrl);
    },[getCtrl,ctrl])

    const stateRef=useRef({
        ctrl,
        isTouch:false,
        scale:initState?.scale??1,
        x:initState?.x??0,
        y:initState?.y??0,
        anchorScaleDist:null as number|null,
        anchorScale:1,
        anchorScaleX:null as number|null,
        anchorScaleY:null as number|null,
        anchorX:0,
        anchorY:0,
        anchorPanT:null as {x:number,y:number}|null,
        anchorPanCount:null as number|null,
        mouseDown:false,
        lastWheelTime:0,
        wheelScale:1,
        wheelX:0,
        wheelY:0,

        dragTarget:null as {elem:HTMLElement,dt:DragTarget}|null,
        dragX:0,
        dragY:0,
        dragAnchorX:0,
        dragAnchorY:0,

        ignore,
        ignoreClasses,
        dragTargets
    })
    stateRef.current.ignore=ignore;
    stateRef.current.ignoreClasses=ignoreClasses;
    stateRef.current.dragTargets=dragTargets;

    const onPoints=useCallback((points:TouchPoint[])=>{
        if(!plane){
            return;
        }
        const state=stateRef.current;

        if(!state.dragTarget && (state.ignore || state.ignoreClasses)){
            for(let i=0;i<points.length;i++){
                if(matchHierarchy(points[i].target,state.ignoreClasses,state.ignore)){
                    if(state.dragTargets){
                        let _continue=false;
                        for(const t of state.dragTargets){
                            if(matchHierarchy(points[i].target,t.className,t.selector)){
                                _continue=true;
                            }
                        }
                        if(_continue){
                            continue;
                        }
                    }
                    points.splice(i,1);
                    i--;
                }
            }
        }

        const clearDragTarget=()=>{
            const t=state.dragTarget;
            state.dragTarget=null;
            t?.dt.onEnd?.({x:state.dragX,y:state.dragY},t.elem);
        }

        if(points.length===0){
            state.anchorPanT=null;
            state.anchorPanCount=null;
            state.anchorScaleDist=null;
            state.anchorScaleX=null;
            state.anchorScaleY=null;
            clearDragTarget();
            return;
        }

        if(state.dragTargets && !state.dragTarget && !state.anchorPanT && points.length){
            for(const t of state.dragTargets){
                let match=matchHierarchy(points[0].target,t.className,t.selector);
                if(t.targetParentClass){
                    match=matchHierarchy(match as EventTarget,t.targetParentClass);
                }
                if(match instanceof HTMLElement){
                    state.dragTarget={elem:match,dt:t};
                    break;
                }
            }
        }

        let t1:TouchPoint|null=null;
        let t2:TouchPoint|null=null;

        for(const t of points){
            if(!t1){
                t1=t;
                if(state.dragTarget){
                    break;
                }else{
                    continue;
                }
            }
            if(!t2){
                t2=t;
                continue;
            }
        }

        if(t1){

            let x:number;
            let y:number;
            if(t2){
                const minX=Math.min(t1.clientX,t2.clientX);
                const minY=Math.min(t1.clientY,t2.clientY);
                const w=Math.max(t1.clientX,t2.clientX)-minX;
                const h=Math.max(t1.clientY,t2.clientY)-minY;
                x=minX+w/2;
                y=minY+h/2;
            }else{
                x=t1.clientX;
                y=t1.clientY;
            }


            if(state.anchorPanT===null || state.anchorPanCount!==points.length){
                if(state.dragTarget){
                    const match=/translate\(\s*([-\d.]+)px[,\s]*([-\d.]+)px\s*\)/i.exec(state.dragTarget.elem.style.transform??'');
                    state.dragAnchorX=match?Number(match[1]):0;
                    state.dragAnchorY=match?Number(match[2]):0;
                    state.anchorX=x;
                    state.anchorY=y;
                }else{
                    state.anchorX=state.x;
                    state.anchorY=state.y;
                }
                state.anchorPanT={x,y};
                state.anchorPanCount=points.length;
            }

            if(t2){// scale
                const dist=Math.sqrt(Math.pow(t1.clientX-t2.clientX,2)+Math.pow(t1.clientY-t2.clientY,2))
                if(state.anchorScaleDist===null){
                    state.anchorScaleDist=dist;
                    state.anchorScale=state.scale;
                    const rect=plane.getBoundingClientRect();
                    state.anchorScaleX=(x-rect.left)/state.scale;
                    state.anchorScaleY=(y-rect.top)/state.scale;
                }

                state.scale=Math.max(minScale,Math.min(maxScale,dist/state.anchorScaleDist*state.anchorScale));


            }else{
                state.anchorScaleDist=null;
                state.anchorScaleX=null;
                state.anchorScaleY=null;
            }


            if(state.dragTarget){
                state.dragX=(x-state.anchorX)/state.scale+state.dragAnchorX;
                state.dragY=(y-state.anchorY)/state.scale+state.dragAnchorY
            }else{
                state.x=(state.anchorX??0)+x-state.anchorPanT.x;
                state.y=(state.anchorY??0)+y-state.anchorPanT.y;

                if(state.anchorScaleX!==null){
                    state.x-=(state.anchorScaleX*state.scale)-state.anchorScaleX*state.anchorScale;
                }

                if(state.anchorScaleY!==null){
                    state.y-=(state.anchorScaleY*state.scale)-state.anchorScaleY*state.anchorScale;
                }
            }


        }else{
            state.anchorPanT=null;
            state.anchorPanCount=null;
            clearDragTarget();
        }

        if(state.dragTarget){
            if(!state.dragTarget.dt.skipSetTransform){
                state.dragTarget.elem.style.transform=`translate(${state.dragX}px,${state.dragY}px)`
            }
            state.dragTarget.dt.onMove?.({x:state.dragX,y:state.dragY},state.dragTarget.elem);
        }else{
            const pState=state.ctrl.state.value;
            if(pState.x!==state.x || pState.y!==state.y || pState.scale!==state.scale){
                state.ctrl.state.next({
                    x:state.x,
                    y:state.y,
                    scale:state.scale
                })
            }
        }

    },[minScale,maxScale,plane])

    const onTouch=useCallback((e:TouchEvent)=>{
        stateRef.current.isTouch=true;
        const points:TouchPoint[]=[];
        for(let i=0;i<e.touches.length;i++){
            const t=e.touches.item(i);
            if(e.type==='touchend' && e.changedTouches.identifiedTouch && e.changedTouches.identifiedTouch(t.identifier)){
                continue;
            }
            points.push(t);
        }
        if((e.type==='touchend' || e.type==='touchcancel') && e.changedTouches){
            for(let i=0;i<e.changedTouches.length;i++){
                const c=e.changedTouches.item(i);
                const r=points.findIndex(t=>t.identifier===c.identifier);
                if(r!==-1){
                    points.splice(i,1);
                }
            }
        }
        onPoints(points);
    },[onPoints])

    const onMouseDown=useCallback((e:MouseEvent)=>{
        const state=stateRef.current;
        if(state.isTouch){
            return;
        }
        state.mouseDown=true;
        onPoints([{
            target:e.target,
            identifier:-1,
            clientX:e.clientX,
            clientY:e.clientY
        }])
    },[onPoints]);

    const onMouseMove=useCallback((e:MouseEvent)=>{
        const state=stateRef.current;
        if(state.isTouch || !state.mouseDown){
            return;
        }
        onPoints([{
            target:e.target,
            identifier:-1,
            clientX:e.clientX,
            clientY:e.clientY
        }])
    },[onPoints]);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const onMouseUp=useCallback((e:MouseEvent)=>{
        const state=stateRef.current;
        if(state.isTouch){
            return;
        }
        state.mouseDown=false;
        onPoints([])
    },[onPoints]);

    const onWheel=useCallback((e:WheelEvent)=>{
        const state=stateRef.current;
        const now=Date.now();
        if(now-state.lastWheelTime>1000){
            state.wheelScale=1;
            state.wheelX=e.clientX;
            state.wheelY=e.clientY;
        }else{
            const scaleUnit=100;
            const baseSize=1000;
            state.wheelScale-=e.deltaY/scaleUnit;
            if(state.wheelScale<0.1){
                state.wheelScale=0.1;
            }
            const dist=baseSize*state.wheelScale;
            onPoints([
                {
                    target:document.body,
                    identifier:-1,
                    clientX:state.wheelX,
                    clientY:state.wheelY-dist/2
                },
                {
                    target:document.body,
                    identifier:-2,
                    clientX:state.wheelX,
                    clientY:state.wheelY+dist/2
                },
            ])
        }
        state.lastWheelTime=now;
    },[onPoints])


    return (
        <PanZoomContext.Provider value={ctrl}>
            <div
                className="PanZoomView"
                onTouchStart={onTouch}
                onTouchMove={onTouch}
                onTouchEnd={onTouch}
                onTouchCancel={onTouch}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
                onWheel={onWheel}>

                <div className="plane" ref={setPlane}>
                    {children}
                </div>

                <style global jsx>{`
                    .PanZoomView{
                        position:absolute;
                        left:0;
                        top:0;
                        right:0;
                        bottom:0;
                        overflow:visible;
                    }
                    .PanZoomView .plane{
                        position:absolute;
                        left:0;
                        top:0;
                        width:0;
                        height:0;
                        overflow:visible;
                    }
                `}</style>
            </div>
        </PanZoomContext.Provider>
    )

}

interface TouchPoint{
    target:EventTarget;
    identifier:number;
    clientX:number;
    clientY:number;
}

export interface PanZoomState
{
    x:number;
    y:number;
    scale:number;
}

export class PanZoomCtrl
{
    public readonly state:BehaviorSubject<PanZoomState>;

    public constructor(initState?:PanZoomState)
    {
        this.state=new BehaviorSubject<PanZoomState>(initState?{...initState}:{
            x:0,
            y:0,
            scale:1
        })
    }

    public transformClientPointToPlane(pt:Point):Point
    {
        return {
            x:(pt.x-this.state.value.x)/this.state.value.scale,
            y:(pt.y-this.state.value.y)/this.state.value.scale,
        }
    }
}

export const PanZoomContext=createContext<PanZoomCtrl|null>(null);

export const usePanZoomCtrl=():PanZoomCtrl|null=>
{
    return useContext(PanZoomContext);
}

const matchHierarchy=(target:EventTarget,classes?:string|string[],select?:(elem:Element)=>boolean):Element|null=>{
    let t=target as Element|undefined;
    while(t){

        if(classes){
            if(Array.isArray(classes)){
                for(const c of classes){
                    if(t.classList.contains(c)){
                        return t;
                    }
                }
            }else{
                if(t.classList.contains(classes)){
                    return t;
                }
            }
        }

        if(select && select(t)){
            return t;
        }

        t=t.parentElement??undefined;
    }

    return null;

}
