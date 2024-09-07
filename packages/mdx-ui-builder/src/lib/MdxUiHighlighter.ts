import { atDotCss } from '@iyio/at-dot-css';
import { DisposeCallback, DisposeContainer, InternalOptions, Point, ReadonlySubject, Rect, aryRemoveItem } from "@iyio/common";
import { BehaviorSubject, Observable, Subject } from "rxjs";
import { defaultMdxUiClassNamePrefix, getMdxUiPrefixClassName } from './mdx-ui-builder-lib';
import { MdxUiSelectionEvt, MdxUiSelectionItem } from './mdx-ui-builder-types';

export interface MdxUiHighlighterOptions
{
    root?:HTMLElement;
    overlayContainer?:HTMLElement;
    classPrefix?:string;
    overlayClassName?:string;
    overlayBorderSize?:number;
}

export type MdxUiHighlighterMode='hover'|'all'|'none';


export class MdxUiHighlighter
{
    private readonly options:InternalOptions<MdxUiHighlighterOptions,'overlayClassName'>;

    private readonly removeOverlayContainer:boolean;

    private readonly _mode:BehaviorSubject<MdxUiHighlighterMode>=new BehaviorSubject<MdxUiHighlighterMode>('none');
    public get modeSubject():ReadonlySubject<MdxUiHighlighterMode>{return this._mode}
    public get mode(){return this._mode.value}
    public set mode(value:MdxUiHighlighterMode){
        if(value==this._mode.value){
            return;
        }
        this._mode.next(value);
        this.update();
        this.stopTrackMouse?.();
        if(value==='hover'){
            this.trackMouse();
        }
    }

    private readonly _highlighIds:BehaviorSubject<string[]|null>=new BehaviorSubject<string[]|null>(null);
    public get highlighIdsSubject():ReadonlySubject<string[]|null>{return this._highlighIds}
    public get highlighIds(){return this._highlighIds.value}
    public set highlighIds(value:string[]|null){
        if(value==this._highlighIds.value){
            return;
        }
        this._highlighIds.next(value);
        this.update();
    }

    private readonly _onSelection=new Subject<MdxUiSelectionEvt>();
    public get onSelection():Observable<MdxUiSelectionEvt>{return this._onSelection}

    public constructor({
        root=globalThis.document.body,
        overlayContainer,
        overlayClassName,
        overlayBorderSize=2,
        classPrefix=defaultMdxUiClassNamePrefix
    }:MdxUiHighlighterOptions){
        if(overlayContainer){
            this.removeOverlayContainer=false;
        }else{
            overlayContainer=globalThis.document.createElement('div');
            overlayContainer.className=style.overlayContainer();
            globalThis.document.body.append(overlayContainer);
            this.removeOverlayContainer=true;
        }
        this.options={
            root,
            overlayContainer,
            overlayClassName,
            overlayBorderSize,
            classPrefix,
        }
        const updateCallback=()=>this.update();
        globalThis.window?.addEventListener('mousedown',this.onWindowMouseDown);
        globalThis.window?.addEventListener('keyup',updateCallback);
        globalThis.window?.addEventListener('scroll',updateCallback);
        globalThis.window?.addEventListener('scrollend',updateCallback);
        this.disposables.addCb(()=>{
            globalThis.window?.removeEventListener('mousedown',this.onWindowMouseDown);
            globalThis.window?.removeEventListener('keyup',updateCallback);
            globalThis.window?.removeEventListener('scroll',updateCallback);
            globalThis.window?.removeEventListener('scrollend',updateCallback);
        })
    }

    private stopTrackMouse?:DisposeCallback;
    private trackMouse(){
        this.stopTrackMouse?.();
        const listener=(evt:MouseEvent)=>{
            this.update({x:evt.clientX,y:evt.clientY});
        }
        this.stopTrackMouse=()=>{
            window.removeEventListener('mousemove',listener);
        }
        window.addEventListener('mousemove',listener);
    }

    private readonly onWindowMouseDown=(evt:MouseEvent)=>{
        let hit=false;
        for(const area of this.areas){
            if(!isAreaHit(area,evt)){
                continue;
            }
            hit=true;
            if(!this._highlighIds.value?.includes(area.id)){
                const item:MdxUiSelectionItem={
                    target:area.target,
                    id:area.id,
                }
                this._onSelection.next({
                    mouseEvent:evt,
                    selection:{
                        item,
                        all:[item],
                    },
                })
                return;
            }
        }
        if(!hit && (evt.target instanceof Element) && this.options.root.contains(evt.target)){
            this._onSelection.next({
                mouseEvent:evt,
                selection:null
            })
        }
    }

    private readonly disposables=new DisposeContainer();
    private _isDisposed=false;
    public get isDisposed(){return this._isDisposed}
    public dispose()
    {
        if(this._isDisposed){
            return;
        }
        this._isDisposed=true;
        this.disposables.dispose();
        this.stopTrackMouse?.();
        while(this.areas.length){
            this.removeArea(this.areas[0] as Area);
        }
        if(this.removeOverlayContainer){
            this.options.overlayContainer.remove();
        }
        globalThis.document?.body.classList.remove(style.cursor());
    }

    private cursorEnabled=false;
    private setCursor(enabled:boolean){
        if(this.cursorEnabled===enabled || this.isDisposed){
            return;
        }
        this.cursorEnabled=enabled;
        if(enabled){
            globalThis.document?.body.classList.add(style.cursor());
        }else{
            globalThis.document?.body.classList.remove(style.cursor());
        }
    }

    private readonly areas:Area[]=[];
    private updateId=0;

    public update(mousePosition?:Point)
    {
        if(this._isDisposed || !globalThis.document){
            return;
        }

        const updateId=++this.updateId;
        const elems:Element[]=[];

        let cursorElem:Element|undefined;

        if(this.mode==='all'){
            this.selectElemsAndDescendants(elems,this.options.root);
        }else if(this.mode==='hover' && mousePosition){
            const hoverElems=globalThis.document?.elementsFromPoint(mousePosition.x,mousePosition.y);
            for(const elem of hoverElems){
                if( getMdxUiPrefixClassName(elem,this.options.classPrefix) &&
                    !elems.includes(elem) &&
                    (elem===this.options.root || this.options.root.contains(elem))
                ){
                    cursorElem=elem;
                    elems.push(elem);
                    break;
                }
            }
        }

        const highlighIds=this.highlighIds;
        if(highlighIds){
            for(const id of highlighIds){
                const matchElems=globalThis.document.getElementsByClassName(id);
                for(let i=0;i<matchElems.length;i++){
                    const elem=matchElems.item(i);
                    if(cursorElem===elem){
                        cursorElem=undefined;
                    }
                    if(elem && !elems.includes(elem)){
                        elems.push(elem);
                    }
                }
            }
        }

        this.setCursor(cursorElem?true:false);

        const containerBounds=this.options.overlayContainer.getBoundingClientRect();
        for(const elem of elems){
            let area=this.getAreaForElem(elem);
            if(!area){

                const id=getMdxUiPrefixClassName(elem,this.options.classPrefix);
                if(!id){
                    continue;
                }

                area={
                    id,
                    target:elem,
                    updateId,
                    overlay:this.createOverlayElem(),
                    bounds:{x:0,y:0,width:0,height:0},
                }
                this.options.overlayContainer.append(area.overlay);
                this.areas.push(area);
            }
            area.updateId=updateId;
            this.updateArea(area,containerBounds);
        }

        for(const area of this.areas){
            if(area.updateId!==updateId){
                this.removeArea(area);
            }
        }
    }

    private createOverlayElem(){
        const overlay=globalThis.document.createElement('div');
        overlay.className=style.overlay(null,this.options.overlayClassName);
        style.vars({
            borderSize:this.options.overlayBorderSize+'px',
            negBorderSize:(-this.options.overlayBorderSize)+'px',
        },overlay);
        overlay.innerHTML=/*html*/`
            <div class="${style.top()}"></div>
            <div class="${style.bottom()}"></div>
            <div class="${style.left()}"></div>
            <div class="${style.right()}"></div>
        `

        return overlay;
    }

    private removeArea(area:Area){
        area.overlay.remove();
        aryRemoveItem(this.areas,area);
    }

    private updateArea(area:Area,containerBounds?:DOMRect){
        if(!containerBounds){
            containerBounds=this.options.overlayContainer.getBoundingClientRect();
        }

        const {overlay,target}=area;
        const bounds=target.getBoundingClientRect();
        area.bounds.x=bounds.x;
        area.bounds.y=bounds.y;
        area.bounds.width=bounds.width;
        area.bounds.height=bounds.height;
        overlay.style.transform=`translate(${bounds.x-containerBounds.x}px,${bounds.y-containerBounds.y}px)`;
        overlay.style.width=bounds.width+'px';
        overlay.style.height=bounds.height+'px';
    }

    private getAreaForElem(elem:Element):Area|undefined{
        for(let i=0;i<this.areas.length;i++){
            const area=this.areas[i];
            if(area?.target===elem){
                return area;
            }
        }
        return undefined;
    }

    private selectElemsAndDescendants(elems:Element[],elem:Element){
        if(getMdxUiPrefixClassName(elem,this.options.classPrefix)){
            elems.push(elem);
        }

        for(let i=0;i<elem.childNodes.length;i++){
            const child=elem.children.item(i);
            if(!child){
                continue;
            }
            this.selectElemsAndDescendants(elems,child);
        }
    }
}

interface Area
{
    id:string;
    target:Element;
    overlay:HTMLElement;
    updateId:number;
    bounds:Rect;
}

const isAreaHit=(area:Area,evt:MouseEvent):boolean=>{
    const b=area.bounds;
    return (
        b.x<=evt.clientX && b.x+b.width>=evt.clientX &&
        b.y<=evt.clientY && b.y+b.height>=evt.clientY
    )
}

const style=atDotCss({name:'MdxUiHighlighter',css:`
    @.overlay{
        position:absolute;
        left:0;
        top:0;
        background-color:transparent;
        pointer-events:none;
    }
    @.overlayContainer{
        position:fixed;
        left:0;
        top:0;
        z-index:10000;
    }

    @.top,@.bottom,@.left,@.right{
        position:absolute;
        backdrop-filter:invert(50%);
        pointer-events:none;
    }
    @.top{
        top:@@negBorderSize;
        left:0;
        height:@@borderSize;
        width:100%;
    }
    @.bottom{
        bottom:@@negBorderSize;
        left:0;
        height:@@borderSize;
        width:100%;

    }
    @.left{
        top:@@negBorderSize;
        left:@@negBorderSize;
        width:@@borderSize;
        height:calc( 100% + @@borderSize + @@borderSize );
    }
    @.right{
        top:@@negBorderSize;
        right:@@negBorderSize;
        width:@@borderSize;
        height:calc( 100% + @@borderSize + @@borderSize );
    }

    @.cursor{
        cursor:pointer !important;
    }

`});
