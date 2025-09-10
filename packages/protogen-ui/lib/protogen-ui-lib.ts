import { Point } from "@iyio/common";
import { protoGetEmptyLayout, ProtoLayout, ProtoLink, ProtoLinkPriority } from "@iyio/protogen";
import type { NodeCtrl } from "./NodeCtrl.js";

export const anchorInset=0;

export type UiState='info'|'success'|'warn'|'danger';

export interface SaveRequest
{
    /**
     * File name
     */
    name?:string;
    content:string;
    snapshot?:boolean;
    /**
     * Can not be used with snapshot
     */
    executePipeline?:boolean;

    /**
     * Can later be used to get on-going output from execution.
     */
    outputId?:string;
}

export interface SaveResult
{
    output?:string;
}

export interface LoadRequest
{
    name?:string;
}


export interface ProtoUiLine{
    fromAddress:string;
    toAddress:string;
    updateId:number;
    elem:SVGPathElement;
    elem2:SVGPathElement;
    p1:Point;
    p2:Point;
    color:string;
    link:ProtoLink;
    priority:ProtoLinkPriority,
}


export interface ProtoUiLengthStyle
{
    min:number;
    max:number;
    minOpacity:number;
}

export const getDistanceOpacity=(length:number,style:ProtoUiLengthStyle):number=>{
    if(length<=style.min){
        return 1;
    }else if(length>=style.max){
        return style.minOpacity;
    }else{
        length-=style.min;
        const max=style.max-style.min;
        return style.minOpacity+ ((max-length)/max)*(1-style.minOpacity);
    }
}

export interface ProtoAnchor
{
    side:'left'|'right';
    layout:ProtoLayout;
    ctrl:NodeCtrl;
    time:number;
}

export interface NodeCtrlAndProp
{
    node:NodeCtrl;
    prop?:ProtoLayout;
}

export const getNodesOnLineAtIndex=(elem:Node,index:number):Node[]=>{
    let ci=0;
    const lineNodes:Node[]=[];
    for(let i=0;i<elem.childNodes.length;i++){

        const node=elem.childNodes.item(i);
        lineNodes.push(node);

        const text=node.textContent;
        if(!text){
            continue;
        }

        for(let c=0;c<text.length;c++){
            ci++;
            const char=text.charAt(c);
            if(char==='\n'){
                if(ci-1>=index){
                    return lineNodes;
                }
                lineNodes.splice(0,lineNodes.length);
                continue;
            }
            if(!lineNodes.includes(node)){
                lineNodes.push(node);
            }

        }
    }
    return ci-1>=index?lineNodes:[];
}




export const getElemProtoLayout=(elem:HTMLElement|null,scale:number):ProtoLayout=>{
    let canvasRect:DOMRect|null=null;
    const nodeRect=elem?.getBoundingClientRect()??protoGetEmptyLayout();
    let node=elem?.parentNode;

    while(node){
        const elem=node instanceof Element?node:null;
        if(elem){
            if(elem.classList.contains('proto-canvas-pos')){
                canvasRect=elem.getBoundingClientRect();
                break;
            }
        }
        node=node.parentNode;
    }

    if(!canvasRect || !nodeRect){
        return protoGetEmptyLayout();
    }

    const localY=(nodeRect.bottom-nodeRect.top)/2+nodeRect.top;
    const y=localY-canvasRect.top;
    const left=nodeRect.left-canvasRect.left+anchorInset;
    const right=nodeRect.right-canvasRect.right-anchorInset;

    return {
        left:left*scale,
        right:right*scale,
        y:y*scale,
        top:(nodeRect.top-canvasRect.top)*scale,
        bottom:(nodeRect.bottom-canvasRect.bottom)*scale,
    }
}

export class DomViewCharPointer
{
    public index:number=0;
    public view:any;
    public char:string;

    private readonly elem:HTMLElement;

    public constructor(elem:HTMLElement)
    {
        this.elem=elem;
        const child=elem.childNodes[0];
        if(child){
            this.view=child;
            this.char=(child.textContent??'').charAt(0);
        }else{
            this.view=null;
            this.char='';
        }
    }

    private childIndex=0;
    private charIndex=0;
    public move(chars:number):void{
        if(chars<0){
            throw new Error('Moving in reverse not supported');
        }
        for(let ci=0;ci<chars;ci++){

            this.index++;
            this.charIndex++;

            let child=this.elem.childNodes[this.childIndex];
            while(child && (child.textContent?.length??0)<=this.charIndex){
                this.childIndex++;
                this.charIndex=0;
                child=this.elem.childNodes[this.childIndex];
            }

            if(child){
                this.view=child;
                this.char=(child.textContent??'').charAt(this.charIndex);
            }else{
                this.view=null;
                this.char='';
            }


        }
    }
}
