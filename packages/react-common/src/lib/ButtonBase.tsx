import { cn, UiActionItem, uiRouterService } from "@iyio/common";
import React, { CSSProperties, KeyboardEvent, MouseEvent } from "react";
import { baseLayoutCn, BaseLayoutOuterProps } from "./base-layout";
import { getReactChildString } from "./react-util";

export interface ButtonBaseProps extends BaseLayoutOuterProps
{
    onClickEvt?:(e:MouseEvent)=>void;
    onClick?:()=>void;
    onKeyPress?:(e:KeyboardEvent)=>void;
    children?:any;
    disabled?:boolean;
    type?:'submit' | 'reset' | 'button';
    to?:string;
    href?:string;
    pop?:boolean;
    actionItem?:UiActionItem;
    elem?:string;
    tabIndex?:number;
    vLinkDesc?:string;
    noVLink?:boolean;
    style?:CSSProperties;
}

export interface ButtonBaseInternalProps extends ButtonBaseProps
{
    baseClassName?:string;
}

export function ButtonBase({
    baseClassName,
    disabled,
    actionItem,
    onClick: onClickProp,
    onClickEvt,
    onKeyPress: onKeyPressProp,
    children,
    type,
    to: toProp,
    href,
    pop,
    elem,
    tabIndex=0,
    vLinkDesc,
    noVLink,
    style,
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

    const onClick=(e?:MouseEvent)=>{

        if(to){
            e?.preventDefault();
            uiRouterService().push(to);
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
            <a tabIndex={-1} className="ioOffScreen" href={to}>{vLinkDesc??getReactChildString(children)??to}</a>
            {children}
        </>
    }

    return React.createElement(elem,{
        type:type,
        disabled:disabled,
        className: cn(baseClassName, { disabled }, baseLayoutCn(props)),
        onClick,
        tabIndex,
        onKeyPress,
        href:elem==='a'?to:undefined,
        style,
        'data-href':to,
    },children);

}
