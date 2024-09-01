import { atDotCss } from "@iyio/at-dot-css";
import { base64UrlReg, createBase64DataUrl, domListener, isDomNodeDescendantOf, MutableRef, Point } from "@iyio/common";
import { createContext, MouseEvent, TouchEvent, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { BehaviorSubject } from "rxjs";
import { PanZoomControls } from "./PanZoomControls";

export type PanZoomDragElem=HTMLElement|SVGElement;

export type PanZoomGetAnchorPoint=(elem:Element)=>Point|null|undefined;

export interface DragTarget{
    selector?:(elem:Element)=>boolean;
    className?:string;
    targetParentClass?:string;
    skipSetTransform?:boolean;

    /**
     * Called on the end of dragging and when the element of the drag target is an HTMLElement.
     * Use onElementMove is you need to support non HTMLElement element types.
     */
    onEnd?:(pt:Point,elem:HTMLElement)=>void;

    /**
     * Called each move step of dragging and when the element of the drag target is an HTMLElement.
     * Use onElementMove is you need to support non HTMLElement element types.
     */
    onMove?:(pt:Point,elem:HTMLElement)=>void;

    /**
     * Called on the end of dragging.
     */
    onElementEnd?:(pt:Point,elem:PanZoomDragElem)=>void;

    /**
     * Called each move step of dragging.
     */
    onElementMove?:(pt:Point,elem:PanZoomDragElem)=>void;

    getAnchorPt?:PanZoomGetAnchorPoint;
}

/**
 * Editor mode requires users use the middle button to pan and cmd + scroll wheel to zoom
 */
export type PanZoomMode='default'|'editor'|'scroll';

export interface PanZoomViewProps
{
    children?:any;
    minScale?:number;
    maxScale?:number;
    initState?:PanZoomState;
    mode?:PanZoomMode;
    disableScroll?:boolean;
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

    /**
     * A background image url that will be scaled and translated with the pan zoom plane
     */
    backgroundUrl?:string;

    /**
     * An svg that will be used as the background of the PanZoomView. The background will be scaled
     * and translated with the pan zoom plane. This prop should be the markup of an svg not a URL.
     * To save memory you can pass the svg as a mutable ref, but be aware that the value of the
     * mutable ref will be converted into a data URL containing the original svg content as a
     * base64 string.
     */
    backgroundSvg?:string|MutableRef<string>;

    backgroundSize?:string;

    onBgClick?:()=>void;

    /**
     * Content rendered before the plane element
     */
    beforePlane?:any;

    /**
     * Content rendered after the plane element
     */
    afterPlane?:any;

    disabled?:boolean;

    controls?:boolean|((ctrl:PanZoomCtrl)=>any);

    /**
     * If true a marker will be place in the center of the viewport.
     */
    markCenter?:boolean;

    /**
     * If true contents will not be allowed to fully level the viewport
     */
    bound?:boolean;

    /**
     * If true CMD + PLUS and CMD + MINUS will zoom in and out
     */
    listenToKeys?:boolean;

    /**
     * If true selections make by pressing the mouse down and dragging will be forcefully disabled
     * by preventing the default action of all mouse down events received by the PanZoomView
     * component.
     */
    forcePreventDragSelection?:boolean;
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
    mode='default',
    backgroundSvg,
    backgroundUrl,
    backgroundSize,
    onBgClick,
    beforePlane,
    afterPlane,
    disabled,
    controls,
    markCenter,
    bound,
    disableScroll,
    listenToKeys,
    forcePreventDragSelection
}:PanZoomViewProps){

    const [rootElem,setRootElem]=useState<HTMLElement|null>(null);
    const [plane,setPlane]=useState<HTMLDivElement|null>(null);

    const initRef=useRef(initState);

    const ctrlRefs=useRef<CtrlRefs>({rootElem,plane,minScale,maxScale,bound});
    ctrlRefs.current.rootElem=rootElem;
    ctrlRefs.current.plane=plane;
    ctrlRefs.current.minScale=minScale;
    ctrlRefs.current.maxScale=maxScale;
    ctrlRefs.current.bound=bound;


    const ctrl=useMemo(()=>new PanZoomCtrl(ctrlRefs.current,initRef.current),[]);

    const hasBg=(backgroundUrl || backgroundSvg)?true:false;
    let bgIsMutableRef=false;
    if( backgroundSvg &&
        (bgIsMutableRef=(typeof backgroundSvg === 'object')) &&
        !backgroundSvg.mutated
    ){
        if(!base64UrlReg.test(backgroundSvg.mutableRef??'')){
            backgroundSvg.mutableRef=`url('${createBase64DataUrl(backgroundSvg.mutableRef,'image/svg+xml')}')`;
        }
        backgroundSvg.mutated=true;
    }

    useEffect(()=>{
        if(!plane || !rootElem){
            return;
        }

        const updateBg=(pt:PanZoomState)=>{
            if(hasBg){
                rootElem.style.backgroundPosition=`${pt.x}px ${pt.y}px`;
                rootElem.style.backgroundSize=`calc(${backgroundSize??'100px'} * ${pt.scale})`
            }else{
                rootElem.style.backgroundPosition='';
                rootElem.style.backgroundSize='';
            }
        }

        const sub=ctrl.state.subscribe(v=>{
            plane.style.transform=`translate(${v.x}px,${v.y}px) scale(${v.scale})`;
            stateRef.current.scale=v.scale;
            stateRef.current.x=v.x;
            stateRef.current.y=v.y;
            if(hasBg){
                updateBg(v);
            }
        })

        updateBg({x:0,y:0,scale:1});

        return ()=>{
            sub.unsubscribe();
        }

    },[ctrl,plane,rootElem,hasBg,backgroundSize]);

    useEffect(()=>{
        getCtrl?.(ctrl);
    },[getCtrl,ctrl])

    const stateRef=useRef({
        ctrl,
        isTouch:false,
        mode,
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
        dragDown:false,
        dragKeyDown:false,
        lastMiddleUp:0,

        dragTarget:null as {elem:PanZoomDragElem,dt:DragTarget}|null,
        dragX:0,
        dragY:0,
        dragAnchorX:0,
        dragAnchorY:0,
        ignoreRest:false,

        ignore,
        ignoreClasses,
        dragTargets,
        disabled,
        bound,
        forcePreventDragSelection,

    })
    stateRef.current.mode=mode;
    stateRef.current.ignore=ignore;
    stateRef.current.ignoreClasses=ignoreClasses;
    stateRef.current.dragTargets=dragTargets;
    stateRef.current.disabled=disabled;
    stateRef.current.bound=bound;
    stateRef.current.forcePreventDragSelection=forcePreventDragSelection;

    const onPoints=useCallback((points:TouchPoint[], simTouch=false)=>{
        if(!plane){
            return;
        }

        const state=stateRef.current;

        const dragInput=state.dragDown || state.dragKeyDown;

        const editorDrag=!simTouch && state.mode==='editor' && dragInput;
        const dragTargetOnly=!simTouch && state.mode==='editor' && !dragInput;

        const shouldIgnore=(target:EventTarget)=>{
            if(editorDrag || !(state.ignore && !state.ignoreClasses)){
                return false;
            }
            if(matchHierarchy(target,state.ignoreClasses,state.ignore)){
                if(state.dragTargets){
                    for(const t of state.dragTargets){
                        if(matchHierarchy(target,t.className,t.selector)){
                            return false;
                        }
                    }
                }
                return true;
            }else{
                return false;
            }
        }

        const clearDragTarget=()=>{
            const t=state.dragTarget;
            state.dragTarget=null;
            state.ignoreRest=false;
            if(!t){
                return;
            }
            if(t.elem instanceof HTMLElement){
                t.dt.onEnd?.({x:state.dragX,y:state.dragY},t.elem);
            }
            t.dt.onElementEnd?.({x:state.dragX,y:state.dragY},t.elem);

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

        if(state.ignoreRest || state.disabled){
            return;
        }

        if(state.dragTargets && !state.dragTarget && !state.anchorPanT && points.length && !editorDrag){
            for(const t of state.dragTargets){
                if(!points[0]){
                    continue;
                }
                let match=matchHierarchy(points[0].target,t.className,t.selector);
                if(t.targetParentClass){
                    match=matchHierarchy(match as EventTarget,t.targetParentClass);
                }
                if((match instanceof HTMLElement) || (match instanceof SVGElement)){
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
                    if(state.dragTarget.dt.getAnchorPt){
                        const pt=state.dragTarget.dt.getAnchorPt(state.dragTarget.elem)??{x:0,y:0};
                        state.dragAnchorX=pt.x;
                        state.dragAnchorY=pt.y;
                        state.anchorX=pt.x;
                        state.anchorY=pt.y;
                    }else{
                        const match=/translate\(\s*([-\d.]+)px[,\s]*([-\d.]+)px\s*\)/i.exec(state.dragTarget.elem.style.transform??'');
                        state.dragAnchorX=match?Number(match[1]):0;
                        state.dragAnchorY=match?Number(match[2]):0;
                        state.anchorX=x;
                        state.anchorY=y;
                    }
                }else{
                    if(shouldIgnore(t1.target)){
                        state.ignoreRest=true;
                        return;
                    }
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
            }else if(!dragTargetOnly){
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

        if(state.bound && rootElem){

            const pt=checkBounds(rootElem,state);
            state.x=pt.x;
            state.y=pt.y;
        }

        if(state.dragTarget){
            if(!state.dragTarget.dt.skipSetTransform){
                state.dragTarget.elem.style.transform=`translate(${state.dragX}px,${state.dragY}px)`
            }
            const e=state.dragTarget.elem;
            if(e instanceof HTMLElement){
                state.dragTarget.dt.onMove?.({x:state.dragX,y:state.dragY},e);
            }
            state.dragTarget.dt.onElementMove?.({x:state.dragX,y:state.dragY},e);
        }else{
            const pState=state.ctrl.state.value;
            if((pState.x!==state.x || pState.y!==state.y || pState.scale!==state.scale) && !dragTargetOnly){
                state.ctrl.state.next({
                    x:state.x,
                    y:state.y,
                    scale:state.scale
                })
            }
        }

    },[minScale,maxScale,plane,rootElem])

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
        onPoints(points,true);
    },[onPoints])

    const onMouseDown=useCallback((e:MouseEvent)=>{
        if(e.button===2){
            return;
        }
        if(stateRef.current.forcePreventDragSelection){
            e.preventDefault();
        }
        const state=stateRef.current;
        if(state.isTouch){
            return;
        }
        state.mouseDown=true;
        state.dragDown=e.button===1;
        if(state.dragDown){
            e.preventDefault();
        }
        onPoints([{
            target:e.target,
            identifier:-1,
            clientX:e.clientX,
            clientY:e.clientY
        }])
    },[onPoints]);

    const onMouseMove=useCallback((e:MouseEvent)=>{
        if(e.button===2){
            return;
        }
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

    const onMouseUp=useCallback((e:MouseEvent)=>{
        if(e.button===2){
            return;
        }
        const state=stateRef.current;
        if(state.isTouch){
            return;
        }
        state.mouseDown=false;
        if(e.button===1){
            state.lastMiddleUp=Date.now();
        }
        onPoints([])
    },[onPoints]);

    useEffect(()=>{

        if(!rootElem || disableScroll){
            return;
        }

        const listener=(e:WheelEvent)=>{

            if(!isDomNodeDescendantOf(e.target as any,rootElem,true)){
                return;
            }

            e.preventDefault();
            const state=stateRef.current;
            if(state.mouseDown || e.button===1){
                return;
            }

            const ctrl=e.metaKey || e.ctrlKey;

            if(state.mode==='default' || ctrl){

                const startDiff=300;
                const delta=-e.deltaY;

                onPoints([],true);
                onPoints([{
                    target:document.body,
                    identifier:-1,
                    clientX:e.clientX,
                    clientY:e.clientY-startDiff
                },{
                    target:document.body,
                    identifier:-2,
                    clientX:e.clientX,
                    clientY:e.clientY+startDiff
                }],true);
                onPoints([{
                    target:document.body,
                    identifier:-1,
                    clientX:e.clientX,
                    clientY:e.clientY-startDiff-delta
                },{
                    target:document.body,
                    identifier:-2,
                    clientX:e.clientX,
                    clientY:e.clientY+startDiff+delta
                }],true);
                onPoints([],true);

            }else if(Date.now()-state.lastMiddleUp>200){

                onPoints([],true);
                onPoints([{
                    target:document.body,
                    identifier:-1,
                    clientX:0,
                    clientY:0
                }],true);
                onPoints([{
                    target:document.body,
                    identifier:-1,
                    clientX:-e.deltaX,
                    clientY:-e.deltaY
                }],true);
                onPoints([],true);
            }
        }

        window.addEventListener('wheel',listener,{passive:false});

        return ()=>{
            window.removeEventListener('wheel',listener)
        }


    },[onPoints,rootElem,disableScroll]);


    const [dragCover,setDragCover]=useState<HTMLElement|null>(null);
    useEffect(()=>{
        if(!dragCover){
            return;
        }

        const state=stateRef.current;

        const onKeyDown=(e:KeyboardEvent)=>{
            if(e.code==='Space' && (!document.activeElement || document.activeElement===document.body)){
                state.dragKeyDown=true;
                dragCover.style.display='block';
            }
        }

        const onKeyUp=(e:KeyboardEvent)=>{
            if(e.code==='Space' && state.dragKeyDown){
                state.dragKeyDown=false;
                dragCover.style.display='none';
            }
        }

        window.addEventListener('keydown',onKeyDown);
        window.addEventListener('keyup',onKeyUp);
        return ()=>{
            window.removeEventListener('keydown',onKeyDown);
            window.removeEventListener('keyup',onKeyUp);
        }
    },[dragCover])

    useEffect(()=>{
        if(!listenToKeys || disabled){
            return;
        }
        return domListener().keyDownEvt.addListenerWithDispose(e=>{
            switch(e.keyMod){
                case 'ctrl+equal':
                    ctrl.zoom(0.2);
                    e.preventDefault();
                    break;
                case 'ctrl+minus':
                    ctrl.zoom(-0.2);
                    e.preventDefault();
                    break;
            }
        })
    },[listenToKeys,ctrl,disabled]);

    style.root();

    return (
        <PanZoomContext.Provider value={ctrl}>
            <div
                ref={setRootElem}
                className="PanZoomView"
                onTouchStart={onTouch}
                onTouchMove={onTouch}
                onTouchEnd={onTouch}
                onTouchCancel={onTouch}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
                style={{
                    backgroundImage:backgroundSvg?
                        bgIsMutableRef?
                            (backgroundSvg as MutableRef<string>).mutableRef
                        :
                            backgroundSvg as string
                    :backgroundUrl?
                        `url(${backgroundUrl})`
                    :
                        undefined,
                    backgroundSize:backgroundSize,
                }}
            >
                {onBgClick && <div className="PanZoomView-bgClick" onClick={()=>onBgClick?.()}/>}

                {beforePlane}

                <div className="PanZoomView-plane" ref={setPlane}>
                    {children}
                </div>

                {controls && ((typeof controls==='function')?
                    controls(ctrl)
                :
                    <PanZoomControls ctrl={ctrl}/>
                )}

                {afterPlane}

                <div ref={setDragCover} className="PanZoomView-dragCover"/>

                {markCenter && <div className="PanZoomView-center"><div/><div/></div>}
            </div>
        </PanZoomContext.Provider>
    )
}

const style=atDotCss({name:'PanZoomView',order:'frameworkHigh',css:`
    .PanZoomView{
        position:absolute;
        left:0;
        top:0;
        right:0;
        bottom:0;
        overflow:visible;
        touch-action:none;
    }
    .PanZoomView-bgClick{
        position:absolute;
        left:0;
        top:0;
        right:0;
        bottom:0;
        background:transparent;
    }
    .PanZoomView-plane{
        position:absolute;
        left:0;
        top:0;
        width:0;
        height:0;
        overflow:visible;
    }
    .PanZoomView-dragCover{
        position:absolute;
        left:0;
        top:0;
        right:0;
        bottom:0;
        display:none;
        cursor:move;
        background:transparent;
    }
    .PanZoomView-center{
        position:absolute;
        left:50%;
        top:50%;
    }
    .PanZoomView-center > div:first-child{
        position:absolute;
        left:-25px;
        top:0.5px;
        width:50px;
        height:1px;
        background-color:#000;
    }
    .PanZoomView-center > div:last-child{
        position:absolute;
        top:-25px;
        left:0.5px;
        height:50px;
        width:1px;
        background-color:#000;
    }
`});

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

interface CtrlRefs
{
    rootElem:HTMLElement|null;
    plane:HTMLElement|null;
    minScale:number;
    maxScale:number;
    bound?:boolean;
}

export class PanZoomCtrl
{
    public readonly state:BehaviorSubject<PanZoomState>;

    private readonly refs:CtrlRefs;

    public constructor(refs:CtrlRefs,initState?:PanZoomState)
    {
        this.refs=refs;
        this.state=new BehaviorSubject<PanZoomState>(initState?{...initState}:{
            x:0,
            y:0,
            scale:1
        })
    }

    public transformClientPointToPlane(pt:Point):Point
    {
        const bounds=this.refs.rootElem?.getBoundingClientRect();
        return {
            x:(pt.x-this.state.value.x)/this.state.value.scale-(bounds?.x??0)/this.state.value.scale,
            y:(pt.y-this.state.value.y)/this.state.value.scale-(bounds?.y??0)/this.state.value.scale,
        }
    }

    public zoom(scale:number,mode:'add'|'set'='add'){
        const {
            rootElem,
            plane,
            minScale,
            maxScale,
        }=this.refs;

        if(mode==='add'){
            scale=this.state.value.scale+scale
        }

        scale=Math.max(minScale,Math.min(maxScale,scale));

        if(scale===this.state.value.scale){
            return scale;
        }

        if(!rootElem || !plane){
            this.state.next({...this.state.value,scale});
            return;
        }

        const oScale=this.state.value.scale;
        const vx=-this.state.value.x;
        const vy=-this.state.value.y;
        const ew=rootElem.offsetWidth;
        const eh=rootElem.offsetHeight;
        const ow=ew*oScale;
        const oh=eh*oScale;
        const w=ew*scale;
        const h=eh*scale;

        const ocx=ow/2;
        const ocy=oh/2;

        const ecx=ew/2;
        const ecy=eh/2;

        const ox=(ocx-ecx);
        const oy=(ocy-ecy);

        const offsetX=(vx-ox)/ow;
        const offsetY=(vy-oy)/oh;

        const cx=w/2;
        const cy=h/2;

        const x=-(cx-ecx)-(w*offsetX);
        const y=-(cy-ecy)-(h*offsetY);

        const pt=checkBounds(rootElem,{x,y,scale});

        this.state.next({...pt,scale});

        return scale;
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

const checkBounds=(rootElem:HTMLElement,state:PanZoomState)=>{
    const w=rootElem.offsetWidth*state.scale;
    const h=rootElem.offsetHeight*state.scale;

    const l=state.x;
    const r=l+w;
    let x=state.x;
    if(l>0){
        x=0;
    }else if(r<rootElem.offsetWidth){
        x=rootElem.offsetWidth-w;
    }

    const t=state.y;
    const b=t+h;
    let y=state.y;
    if(t>0){
        y=0;
    }else if(b<rootElem.offsetHeight){
        y=rootElem.offsetHeight-h;
    }

    return {x,y}
}
