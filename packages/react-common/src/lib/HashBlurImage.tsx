import { BaseLayoutOuterProps, bcn, css } from "@iyio/common";
import { decode } from "blurhash";
import { CSSProperties, useEffect, useState } from "react";
import Style from "styled-jsx/style";

interface HashBlurImageProps extends BaseLayoutOuterProps
{
    hash?:string;
    width?:number;
    height?:number;
    punch?:number;
    style?:CSSProperties;
}

export function HashBlurImage({
    hash,
    width=128,
    height=128,
    punch=1,
    style,
    ...props
}:HashBlurImageProps){

    const [canvas,setCanvas]=useState<HTMLCanvasElement|null>(null);

    useEffect(()=>{
        if(!canvas || !hash){
            return;
        }
        const pixels=decode(hash,width,height,punch);
        canvas.width=width;
        canvas.height=height;
        const context=canvas.getContext('2d');
        if(context){
            const imageData=context.createImageData(width,height);
            imageData.data.set(pixels);
            context.putImageData(imageData,0,0);
        }
    },[canvas,width,height,punch,hash])

    return (
        <div style={style} className={bcn(props,"HashBlurImage")}>
            <canvas ref={setCanvas}/>
            <Style id="HashBlurImage-ZXZt8jBUvy0NOe6SrAMo" global>{css`
                .HashBlurImage{
                    position:relative;
                }
                .HashBlurImage canvas{
                    position:absolute;
                    left:0;
                    top:0;
                    width:100%;
                    height:100%;
                }
            `}</Style>
        </div>
    )

}
