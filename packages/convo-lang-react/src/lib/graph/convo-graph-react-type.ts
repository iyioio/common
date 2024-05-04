import { Point, Rect } from "@iyio/common";
import { ConvoEdge, ConvoInputTemplate, ConvoNode, ConvoTraverser } from "@iyio/convo-lang";
import { BehaviorSubject } from "rxjs";

export interface ConvoEntityLayoutCtrl
{
    elem:HTMLElement;
    node?:ConvoNode;
    edge?:ConvoEdge;
    traverser?:ConvoTraverser;
    input?:ConvoInputTemplate;
    entity:ConvoNode|ConvoEdge|ConvoTraverser|ConvoInputTemplate;
    updateLayout():void;
    getElement(target:ConvoUiTarget):HTMLElement|undefined;
    getElementBounds(target:ConvoUiTarget):Rect|undefined;
    allowDrag:BehaviorSubject<boolean>;
}


export interface ConvoUiTarget
{
    type:'step'|'shell';
    index?:number;
}

export interface ConvoUiLine{
    fromAddress:string;
    toAddress:string;
    updateId:number;
    elem:SVGPathElement;
    elem2:SVGPathElement;
    p1:Point;
    p2:Point;
    color:string;
}

export interface ConvoInputSource
{
    id:string;
    title:string;
    value:any;
}
