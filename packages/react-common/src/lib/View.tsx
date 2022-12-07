import { baseLayoutCn, BaseLayoutProps } from '@iyio/common';
import React, { CSSProperties } from 'react';

export interface ViewProps extends BaseLayoutProps
{
    children?:any;
    elemRef?:(elem:HTMLElement|null)=>void;
    style?:CSSProperties;
}

export function View({
    children,
    elem='div',
    elemRef,
    style,
    ...props
}:ViewProps & {elem?:string}){

    return React.createElement(elem,{ref:elemRef,style,className:baseLayoutCn(props)},children);

}
