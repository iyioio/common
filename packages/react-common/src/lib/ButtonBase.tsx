import { baseLayoutCn, BaseLayoutOuterProps, cn, UiActionItem, uiRouterService } from "@iyio/common";
import { createElement, CSSProperties, DragEventHandler, KeyboardEvent, MouseEvent, MouseEventHandler } from "react";
import { getReactChildString } from "./react-util";

export interface ButtonBaseProps extends BaseLayoutOuterProps
{
    onClickEvt?:(e:MouseEvent)=>void;
    onClick?:()=>void;
    onKeyPress?:(e:KeyboardEvent)=>void;
    onDrag?:DragEventHandler<HTMLElement>;
    onDragCapture?:DragEventHandler<HTMLElement>;
    onDragEnd?:DragEventHandler<HTMLElement>;
    onDragEndCapture?:DragEventHandler<HTMLElement>;
    onDragEnter?:DragEventHandler<HTMLElement>;
    onDragEnterCapture?:DragEventHandler<HTMLElement>;
    onDragExit?:DragEventHandler<HTMLElement>;
    onDragExitCapture?:DragEventHandler<HTMLElement>;
    onDragLeave?:DragEventHandler<HTMLElement>;
    onDragLeaveCapture?:DragEventHandler<HTMLElement>;
    onDragOver?:DragEventHandler<HTMLElement>;
    onDragOverCapture?:DragEventHandler<HTMLElement>;
    onDragStart?:DragEventHandler<HTMLElement>;
    onDragStartCapture?:DragEventHandler<HTMLElement>;
    onDrop?:DragEventHandler<HTMLElement>;
    onDropCapture?:DragEventHandler<HTMLElement>;
    onContextMenu?:MouseEventHandler<HTMLElement>;
    draggable?:boolean;
    children?:any;
    disabled?:boolean;
    type?:'submit' | 'reset' | 'button';
    to?:string;
    href?:string;
    pop?:boolean;
    linkTarget?:string;
    openLinkInNewWindow?:boolean;
    actionItem?:UiActionItem;
    elem?:string;
    elemRef?:(elem:HTMLElement|null)=>void;
    tabIndex?:number;
    vLinkDesc?:string;
    noVLink?:boolean;
    style?:CSSProperties;
    description?:string;
    title?:string;
    extraProps?:Record<string,string|undefined>
}

export interface ButtonBaseInternalProps extends ButtonBaseProps
{
    baseClassName?:string;
}

/**
 * @acIgnore
 */
export function ButtonBase({
    baseClassName,
    actionItem,
    disabled=actionItem?.disabled,
    onClick: onClickProp,
    onClickEvt,
    onKeyPress: onKeyPressProp,
    children,
    type='button',
    to: toProp,
    href,
    pop,
    linkTarget,
    openLinkInNewWindow=actionItem?.openLinkInNewWindow,
    elem,
    elemRef,
    tabIndex=0,
    vLinkDesc,
    noVLink,
    style,
    description,
    title,
    extraProps,
    draggable,
    onDrag,
    onDragCapture,
    onDragEnd,
    onDragEndCapture,
    onDragEnter,
    onDragEnterCapture,
    onDragExit,
    onDragExitCapture,
    onDragLeave,
    onDragLeaveCapture,
    onDragOver,
    onDragOverCapture,
    onDragStart,
    onDragStartCapture,
    onDrop,
    onDropCapture,
    onContextMenu,
    ...props
}:ButtonBaseInternalProps){

    const to=toProp??href??actionItem?.to;
    if(elem){
        elem=elem.toLowerCase();
    }
    if(!elem){
        elem=to?'a':'button';
    }
    const isCustomElem=elem!=='a' && elem!=='button';

    if(actionItem?.linkTarget && linkTarget===undefined){
        linkTarget=actionItem.linkTarget;
    }

    const onClick=(e?:MouseEvent)=>{

        if(to){
            e?.preventDefault();
            if(openLinkInNewWindow || linkTarget || e?.metaKey || e?.ctrlKey){
                uiRouterService().open(to,{target:linkTarget??'_blank'});
            }else{
                uiRouterService().push(to);
            }
        }else if(pop){
            e?.preventDefault();
            uiRouterService().pop();
        }

        onClickProp?.();
        if(e){
            onClickEvt?.(e);
        }
        actionItem?.action?.(actionItem);
    }

    const onKeyPress=(e:KeyboardEvent)=>{
        if( (isCustomElem && (e.code==='Space' || e.code==='Enter')) ||
            (elem==='a' && e.code==='Space')
        ){
            e.preventDefault();
            onClick();
        }
        onKeyPressProp?.(e);
    }

    const isVirtualLink=(to && elem!=='a')?true:false;
    if(isVirtualLink && !noVLink){
        children=<>
            <a tabIndex={-1} className={baseLayoutCn({offScreen:true})} href={to}>{vLinkDesc??getReactChildString(children)??to}</a>
            {children}
        </>
    }

    return createElement(elem,{
        type:type,
        disabled:disabled,
        className: cn(baseClassName, { disabled }, baseLayoutCn(props)),
        onClick,
        tabIndex,
        onKeyPress,
        ref:elemRef,
        href:elem==='a'?to:undefined,
        style,
        title,
        'aria-label':description,
        'data-href':elem==='a'?undefined:to,
        onDrag,
        onDragCapture,
        onDragEnd,
        onDragEndCapture,
        onDragEnter,
        onDragEnterCapture,
        onDragExit,
        onDragExitCapture,
        onDragLeave,
        onDragLeaveCapture,
        onDragOver,
        onDragOverCapture,
        onDragStart,
        onDragStartCapture,
        onDrop,
        onDropCapture,
        onContextMenu,
        draggable,
        ...extraProps,
    },children);

}
