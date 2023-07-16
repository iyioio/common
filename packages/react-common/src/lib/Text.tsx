import { baseLayoutCn, BaseLayoutColorProps, BaseLayoutFontProps, BaseLayoutProps } from "@iyio/common";
import React, { CSSProperties } from "react";


export interface TextProps extends BaseLayoutProps, BaseLayoutFontProps, BaseLayoutColorProps
{
    text?:string;
    children?:any;
    className?:string;
    elemRef?:(elem:HTMLElement|null)=>void;
    style?:CSSProperties;
    p?:boolean;
    title?:string;
}

export function Text({
    text,
    children,
    elem,
    elemRef,
    style,
    p,
    title,
    ...props
}:TextProps & {elem?:string}){

    if(!elem){
        if(props.h1){
            elem='h1';
        }else if(props.h2){
            elem='h2';
        }else if(props.h3){
            elem='h3';
        }else if(props.h4){
            elem='h4';
        }else if(props.h5){
            elem='h5';
        }else if(props.h6){
            elem='h6';
        }else if(p){
            elem='p';
        }else{
            elem='span';
        }
    }

    const c=baseLayoutCn(props);

    return React.createElement(elem,{ref:elemRef,style,title,className:c?'Text '+c:'Text'},children??text);

}
