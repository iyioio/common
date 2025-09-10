import { useEffect, useState } from "react";
import { View, ViewProps } from "../View.js";
import { ToolTipAlignment, useToolTip } from "./tool-tip-lib.js";

export interface ToolTipBaseProps extends ViewProps
{
    toolTip?:any;
    rendererId?:string;
    vAlign?:ToolTipAlignment;
    hAlign?:ToolTipAlignment;
    xOffset?:number;
    yOffset?:number;
    keepOnScreen?:boolean;
}

/**
 * @acIgnore
 */
export function ToolTipBase({
    children,
    toolTip,
    rendererId,
    vAlign,
    hAlign,
    xOffset,
    yOffset,
    keepOnScreen,
    elemRef: elemRefProp,
    ...props
}:ToolTipBaseProps){

    const [elem,setElem]=useState<HTMLElement|null>(null);

    useEffect(()=>{
        elemRefProp?.(elem);
    },[elemRefProp,elem])

    useToolTip({
        watch:elem??undefined,
        children:toolTip,
        rendererId,
        vAlign,
        hAlign,
        xOffset,
        yOffset,
        keepOnScreen
    })

    return (
        <View elemRef={setElem} {...props}>
            {children}
        </View>
    )

}

