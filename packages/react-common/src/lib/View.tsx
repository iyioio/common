import React from 'react';
import { baseLayoutCn, BaseLayoutProps } from './base-layout';

export interface ViewProps extends BaseLayoutProps
{
    children?:any;
    elemRef?:(elem:HTMLElement|null)=>void;
}

export function View({
    children,
    elem='div',
    elemRef,
    ...props
}:ViewProps & {elem?:string}){

    return React.createElement(elem,{ref:elemRef,className:baseLayoutCn(props)},children);

}
