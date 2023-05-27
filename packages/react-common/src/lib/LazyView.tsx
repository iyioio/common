import { cn } from "@iyio/common";
import { useEffect, useState } from "react";
import { View, ViewProps } from "./View";
import { UseLazyRenderOptions, useLazyRender } from "./useLazyRender";

interface LazyViewProps extends ViewProps, UseLazyRenderOptions
{
    placeholderChildren?:any;
}

export function LazyView({
    children,
    className,
    placeholderChildren,
    elemRef,
    style={},
    ...props
}:LazyViewProps & {elem?:string}){

    const [elem,setElem]=useState<HTMLElement|null>(null);

    const {show,minHeight,minWidth}=useLazyRender(elem,props)

    useEffect(()=>{
        elemRef?.(elem);
    },[elemRef,elem])

    return (
        <View
            {...props}
            elemRef={setElem}
            className={cn('LazyView',className)}
            style={{minWidth,minHeight,...style}}
        >
            {show?children:placeholderChildren}
        </View>
    )

}
