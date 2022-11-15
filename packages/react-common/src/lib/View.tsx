import React from 'react';
import { baseLayoutCn, BaseLayoutProps } from './base-layout';

export interface ViewProps extends BaseLayoutProps
{
    children?:any;
}

export function View({
    children,
    elem='div',
    ...props
}:ViewProps & {elem?:string}){

    return React.createElement(elem,{className:baseLayoutCn(props)},children);

}
