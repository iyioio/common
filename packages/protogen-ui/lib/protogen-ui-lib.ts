import { getNodeDOMRect, Point } from "@iyio/common";
import { getEmptyProtoLayout, ProtoLayout, ViewCharPointer } from "@iyio/protogen";
import type { NodeCtrl } from "./NodeCtrl";

export const anchorInset=0;

export interface SaveRequest
{
    name?:string;
    content:string;
    snapshot?:boolean;
}

export interface LoadRequest
{
    name?:string;
}


export interface ProtoUiLine{
    nodeCtrlId:string;
    updateId:number;
    elem:SVGPathElement;
    elem2:SVGPathElement;
    nodeName:string;
    propName?:string;
    p1:Point;
    p2:Point;
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



export const getNodesProtoLayout=(nodes:Node[],scale:number):ProtoLayout=>{
    if(!nodes.length){
        return getEmptyProtoLayout();
    };
    let layout:ProtoLayout|undefined;
    for(const node of nodes){
        if(node instanceof Element){
            layout=getNodeProtoLayout(node,scale);
            break;
        }
    }
    if(!layout){
        layout=getNodeProtoLayout(nodes[0],scale);
    }
    return layout;
}

export const getNodeProtoLayout=(node:Node|null,scale:number):ProtoLayout=>{
    if(!node){
        return getEmptyProtoLayout();
    }
    const elemRect=getNodeDOMRect(node);
    if(!elemRect){
        return getEmptyProtoLayout();
    }
    let canvasRect:DOMRect|null=null;
    let nodeRect:DOMRect|null=null;
    node=node?.parentNode;

    while(node){
        const elem=node instanceof Element?node:null;
        if(elem){
            if(elem.classList.contains('proto-node-pos')){
                nodeRect=elem.getBoundingClientRect();
            }else if(elem.classList.contains('proto-canvas-pos')){
                canvasRect=elem.getBoundingClientRect();
                break;
            }
        }
        node=node.parentNode;
    }

    if(!canvasRect || !nodeRect){
        return getEmptyProtoLayout();
    }

    const localY=(elemRect.bottom-elemRect.top)/2+(elemRect.top-nodeRect.top);
    const y=((elemRect.bottom-elemRect.top)/2+elemRect.top)-canvasRect.top;
    const left=nodeRect.left-canvasRect.left+anchorInset;
    const right=nodeRect.right-canvasRect.right-anchorInset;

    return {
        left:left/scale,
        right:right/scale,
        localY:localY/scale,
        y:y/scale,
        top:(elemRect.top-canvasRect.top)/scale,
        bottom:(elemRect.bottom-canvasRect.bottom)/scale,
        lPt:{x:left/scale,y:y/scale},
        rPt:{x:right/scale,y:y/scale},
    }
}

export const getElemProtoLayout=(elem:HTMLElement|null,scale:number):ProtoLayout=>{
    let canvasRect:DOMRect|null=null;
    const nodeRect=elem?.getBoundingClientRect()??getEmptyProtoLayout();
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
        return getEmptyProtoLayout();
    }

    const localY=(nodeRect.bottom-nodeRect.top)/2+nodeRect.top;
    const y=localY-canvasRect.top;
    const left=nodeRect.left-canvasRect.left+anchorInset;
    const right=nodeRect.right-canvasRect.right-anchorInset;

    return {
        left:left*scale,
        right:right*scale,
        localY:localY*scale,
        y:y*scale,
        top:(nodeRect.top-canvasRect.top)*scale,
        bottom:(nodeRect.bottom-canvasRect.bottom)*scale,
        lPt:{x:left*scale,y:y*scale},
        rPt:{x:right*scale,y:y*scale},
    }
}

export class DomViewCharPointer implements ViewCharPointer
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
