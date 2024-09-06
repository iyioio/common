import { atDotCss } from '@iyio/at-dot-css';
import { DisposeCallback, DisposeContainer, Point, ReadonlySubject, aryRemoveItem } from "@iyio/common";
import { BehaviorSubject } from "rxjs";
import { defaultMdxUiClassNamePrefix } from './mdx-ui-builder-lib';

export interface MdxUiHighlighterOptions
{
    root?:HTMLElement;
    overlayContainer?:HTMLElement;
    classPrefix?:string;
    overlayClassName?:string;
    overlayBorderSize?:number;
}

type OptionalProps='overlayClassName';

export type MdxUiHighlighterMode='hover'|'all'|'none';

export class MdxUiHighlighter
{
    private readonly options:Required<Omit<MdxUiHighlighterOptions,OptionalProps>> & Pick<MdxUiHighlighterOptions,OptionalProps>;

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

        if(this.mode==='all'){
            this.selectElemsAndDescendants(elems,this.options.root);
        }else if(this.mode==='hover' && mousePosition){
            const hoverElems=globalThis.document?.elementsFromPoint(mousePosition.x,mousePosition.y);
            for(const elem of hoverElems){
                if(this.getPrefixClassName(elem) && (elem===this.options.root || this.options.root.contains(elem))){
                    elems.push(elem);
                    break;
                }
            }
        }

        const containerBounds=this.options.overlayContainer.getBoundingClientRect();
        for(const elem of elems){
            let area=this.getAreaForElem(elem);
            if(!area){

                area={
                    className:this.getPrefixClassName(elem)??'',
                    target:elem,
                    updateId,
                    overlay:this.createOverlayElem(),
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
        if(this.getPrefixClassName(elem)){
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

    private getPrefixClassName(elem:Element):string|undefined{
        for(let i=0;i<elem.classList.length;i++){
            const c=elem.classList.item(i);
            if(c?.startsWith(this.options.classPrefix)){
                return c;
            }
        }
        return undefined;
    }
}

interface Area
{
    className:string;
    target:Element;
    overlay:HTMLElement;
    updateId:number;
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

`});
