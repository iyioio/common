import { baseLayoutCn, BaseLayoutProps, cn } from "@iyio/common";
import { CSSProperties } from "react";

export interface ImageProps extends BaseLayoutProps
{
    alt:string;
    title?:string;
    src:string;
    contain?:boolean;
    bgContain?:boolean;
    style?:CSSProperties;
    children?:any;
    size?:string|number;
    height?:string|number;
    width?:string|number;
    tile?:boolean;
    bgSrc?:string|null;
    elemRef?:(elem:HTMLElement|null)=>void;
    unstyled?:boolean;
    aspectRatio?:string|number;
}

export function Image({
    alt,
    src,
    bgSrc,
    title,
    contain,
    bgContain=contain,
    style={},
    elemRef,
    children,
    size,
    height=size,
    width=size,
    tile,
    unstyled,
    aspectRatio,
    ...props
}:ImageProps){

    return (
        <div
            title={title}
            ref={elemRef}
            role="img"
            aria-label={alt}
            className={cn("Image",{contain,tile},baseLayoutCn(props))}
            style={{
                [unstyled?'backgroundImage':'background']:unstyled?(
                    `url(${src})${bgSrc?` ,url(${bgSrc})`:''}`
                ):(
                    `url(${src}) center/${tile?'auto':contain?'contain':'cover'} ${tile?'repeat':'no-repeat'}${bgSrc
                    ?` ,url(${bgSrc}) center/${bgContain?'contain':'cover'} no-repeat`:''}`
                ),
                height,
                width,
                aspectRatio,
                ...style
            }}>
            {children}
        </div>
    )

}
