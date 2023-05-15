import { cn } from "@iyio/common";
import { useEffect, useMemo, useState } from "react";
import { Image, ImageProps } from "./Image";
import { UseLazyRenderOptions, useLazyRender } from "./useLazyRender";

const placeholderUrl='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

export interface LazyImageProps extends Omit<ImageProps,'bgSrc'>, UseLazyRenderOptions
{
    /**
     * Content rendered when the image is in the lazy state
     */
    placeholderChildren?:any;

    /**
     * If true lazy loading is disable and the image loads as normal
     */
    notLazy?:boolean;

    bgSrc?:string|null|(()=>string|undefined|null);


}

export function LazyImage({
    children,
    className,
    placeholderChildren,
    elemRef,
    style={},
    src,
    bgSrc:_bgSrc,
    notLazy,
    ...props
}:LazyImageProps){

    const [elem,setElem]=useState<HTMLElement|null>(null);

    const {show:_show,minHeight,minWidth}=useLazyRender(elem,props);
    const show=notLazy?true:_show;

    const bgSrc=useMemo(()=>show?(typeof _bgSrc === 'function')?_bgSrc():_bgSrc:undefined,[_bgSrc,show]);

    useEffect(()=>{
        elemRef?.(elem);
    },[elemRef,elem]);

    return (
        <Image
            {...props}
            elemRef={setElem}
            className={cn('LazyImage',className)}
            style={{minWidth,minHeight,...style}}
            src={show?src:placeholderUrl}
            bgSrc={show?bgSrc:undefined}
        >
            {show?children:placeholderChildren}
        </Image>
    )

}
