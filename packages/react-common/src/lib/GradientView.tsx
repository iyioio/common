import { BaseLayoutProps, OptionalBooleanSides, Side, bcn, percentToCssHex } from "@iyio/common";
import { CSSProperties } from "react";

export interface GradientPoint
{
    color:string;
    position:string;
}

interface GradientViewProps extends OptionalBooleanSides
{
    direction?:Side;
    rotation?:string;
    hexColor?:string;
    startColor?:string;
    startPosition?:string;
    startOpacity?:number;
    endColor?:string;
    endPosition?:string;
    endOpacity?:number;
    /**
     * If provided all other position and color values are overwritten.
     */
    points?:GradientPoint[];

    style?:CSSProperties,

    children?:any;
}

export function GradientView({
    top,
    left,
    right,
    direction=top?'top':left?'left':right?'right':'bottom',
    rotation=direction==='bottom'?'0deg':direction==='top'?'180deg':direction==='left'?'90deg':'270deg',
    hexColor,
    startOpacity=0.8,
    startPosition="0%",
    startColor=(hexColor??'#000000')+percentToCssHex(startOpacity),
    endOpacity=0,
    endPosition="50%",
    endColor=(hexColor??'#000000')+percentToCssHex(endOpacity),
    points=[{color:startColor,position:startPosition},{color:endColor,position:endPosition}],
    style={},
    children,
    className,
    ...props
}:GradientViewProps & BaseLayoutProps){

    return (
        <div className={bcn(props,"GradientView",className)} style={{
            background:`linear-gradient(${rotation}, ${points.map(p=>`${p.color} ${p.position}`).join(', ')}`,
            ...style,
        }}>
            {children}
        </div>
    )

}
