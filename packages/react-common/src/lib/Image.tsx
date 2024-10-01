import { baseLayoutCn, BaseLayoutProps, cn } from "@iyio/common";
import { createElement, CSSProperties } from "react";

export interface ImageProps extends BaseLayoutProps
{
    alt:string;
    title?:string;
    src:string;
    contain?:boolean;
    bgContain?:boolean;
    style?:CSSProperties;
    children?:any;
    size?:string|number;
    height?:string|number;
    width?:string|number;
    tile?:boolean;
    bgSrc?:string|null;
    elemRef?:(elem:HTMLElement|null)=>void;
    onError?:(evt:any)=>void;
    onLoad?:(evt:any)=>void;
    unstyled?:boolean;
    sq?:boolean;
    landscape?:boolean;
    portrait?:boolean;
    aspectRatio?:string|number;
    imgFixed?:boolean;
    useImgElem?:boolean;
    elemType?:string;
}

export function Image({
    alt,
    src,
    bgSrc,
    title,
    contain,
    bgContain=contain,
    style={},
    elemRef,
    children,
    size,
    height=size,
    width=size,
    tile,
    unstyled,
    sq,
    landscape,
    portrait,
    aspectRatio=landscape?'16/9':portrait?'9/16':sq?1:undefined,
    imgFixed,
    onError,
    onLoad,
    useImgElem,
    elemType=useImgElem?'img':'div',
    ...props
}:ImageProps){

    const elemProps={
        title:title,
        ref:elemRef,
        role:'img',
       'aria-label':alt,
        className:cn("Image",{contain,tile},baseLayoutCn(props)),
        onError:onError,
        onLoad:onLoad,
        style:{
            height,
            width,
            aspectRatio,
            ...style
        }
    }

    if(elemType==='img'){
        (elemProps as any).src=src;
    }else{
        elemProps.style[unstyled?'backgroundImage':'background']=unstyled?(
            `url(${src})${bgSrc?` ,url(${bgSrc})`:''}`
        ):(
            `${imgFixed?'fixed ':''}url(${src}) center/${tile?'auto':contain?'contain':'cover'} ${tile?'repeat':'no-repeat'}${bgSrc
            ?` ,url(${bgSrc}) center/${bgContain?'contain':'cover'} no-repeat`:''}`
        )
    }

    return createElement(elemType,elemProps,children);

}
