import { atDotCss } from "@iyio/at-dot-css";
import { BaseLayoutOuterProps } from "@iyio/common";
import { anyCompIcons } from "./any-comp-icons";
import { acStyle } from "./any-comp-style";

export type AnyCompIconType=keyof typeof anyCompIcons;

export interface AnyCompIconProps
{
    icon:AnyCompIconType;
    color?:string;
    size?:number;
}

export function AnyCompIcon({
    icon,
    size=14,
    color,
    ...props
}:AnyCompIconProps & BaseLayoutOuterProps){

    return (anyCompIcons[icon]??anyCompIcons.default)({size,color,className:style.root(null,null,props)});

}

const style=atDotCss({namespace:'AnyComp',name:'AnyCompIcon',css:`
    @.root{
        fill:${acStyle.var('foregroundColor')};
    }
`});
