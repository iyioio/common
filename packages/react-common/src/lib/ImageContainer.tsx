import { BaseLayoutProps, bcn, css } from "@iyio/common";
import Style from "styled-jsx/style";

export interface ImageContainerProps extends BaseLayoutProps
{
    alt:string;
    src:string;
    fill?:boolean|'width'|'height';
}

export function ImageContainer({
    alt,
    src,
    fill="width",
    ...props
}:ImageContainerProps){

    return (
        <div className={bcn(props,"ImageContainer",fill===true?'fill':fill===false?null:'fill-'+fill)}>
            <img src={src} alt={alt} />
            <Style id="iyio-ImageContainer-WVnL0qooKQHUAFcIrxv7" global jsx>{css`
                .ImageContainer.fill img{
                    width:100%;
                    height:100%;
                }
                .ImageContainer.fill-height img{
                    height:100%;
                }
                .ImageContainer.fill-width img{
                    width:100%;
                }
            `}</Style>
        </div>
    )

}
