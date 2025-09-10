import { baseLayoutCn, BaseLayoutOuterProps } from '@iyio/common';
import { iconSources } from './icon-source.js';

export type BasicIconType=keyof typeof iconSources;

interface BasicIconProps extends BaseLayoutOuterProps
{
    icon:BasicIconType;
    size?:number;
    color?:string;
    className?:string;
}

export function BasicIcon({
    icon,
    size=14,
    color,
    ...props
}:BasicIconProps){

    return (iconSources[icon]??iconSources.default)({size,color,className:baseLayoutCn(props)});

}












