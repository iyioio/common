import { baseLayoutCn, BaseLayoutProps, cn, css } from "@iyio/common";
import { CSSProperties } from "react";
import Style from "styled-jsx/style";

export interface ImageProps extends BaseLayoutProps
{
    alt:string;
    src:string;
    contain?:boolean;
    style?:CSSProperties;
    children?:any;
    height?:string|number;
    width?:string|number;
    tile?:boolean;
}

export function Image({
    alt,
    src,
    contain,
    style={},
    children,
    height,
    width,
    tile,
    ...props
}:ImageProps){

    return (
        <div
            title={alt}
            role="img"
            aria-label={alt}
            className={cn("Image",{contain,tile},baseLayoutCn(props))}
            style={{backgroundImage:`url(${src})`,height,width,...style}}>
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
