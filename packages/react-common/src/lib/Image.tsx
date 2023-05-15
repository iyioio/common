import { baseLayoutCn, BaseLayoutProps, cn, css } from "@iyio/common";
import { CSSProperties } from "react";
import Style from "styled-jsx/style";

export interface ImageProps extends BaseLayoutProps
{
    alt:string;
    title?:string;
    src:string;
    contain?:boolean;
    style?:CSSProperties;
    children?:any;
    height?:string|number;
    width?:string|number;
    tile?:boolean;
    bgSrc?:string|null;
    elemRef?:(elem:HTMLElement|null)=>void;
}

export function Image({
    alt,
    src,
    bgSrc,
    title,
    contain,
    style={},
    elemRef,
    children,
    height,
    width,
    tile,
    ...props
}:ImageProps){

    return (
        <div
            title={title}
            ref={elemRef}
            role="img"
            aria-label={alt}
            className={cn("Image",{contain,tile},baseLayoutCn(props))}
            style={{backgroundImage:`url(${src})${bgSrc?`,url(${bgSrc})`:''}`,height,width,...style}}>
            {children}
            <Style id="iyio-Image-wg03Hn64WGoy0TyWlQJ7" global jsx>{css`
                .Image{
                    background-position:center;
                    background-repeat:no-repeat;
                    background-size:cover;
                }
                .Image.contain{
                    background-size:contain;
                }
                .Image.tile{
                    background-repeat:repeat;
                    background-size:auto;
                }
            `}</Style>
        </div>
    )

}
