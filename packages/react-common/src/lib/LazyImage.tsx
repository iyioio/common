import { cn } from "@iyio/common";
import { useEffect, useState } from "react";
import { Image, ImageProps } from "./Image";
import { UseLazyRenderOptions, useLazyRender } from "./useLazyRender";

const placeholderUrl='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

interface LazyImageProps extends ImageProps, UseLazyRenderOptions
{
    placeholderChildren?:any;
}

export function LazyImage({
    children,
    className,
    placeholderChildren,
    elemRef,
    style={},
    src,
    ...props
}:LazyImageProps){

    const [elem,setElem]=useState<HTMLElement|null>(null);

    const {show,minHeight,minWidth}=useLazyRender(elem,props)

    useEffect(()=>{
        elemRef?.(elem);
    },[elemRef,elem])

    return (
        <Image
            {...props}
            elemRef={setElem}
            className={cn('LazyImage',className)}
            style={{minWidth,minHeight,...style}}
            src={show?src:placeholderUrl}
        >
            {show?children:placeholderChildren}
        </Image>
    )

}
