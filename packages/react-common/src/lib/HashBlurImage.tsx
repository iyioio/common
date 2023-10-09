import { atDotCss } from "@iyio/at-dot-css";
import { BaseLayoutOuterProps, bcn } from "@iyio/common";
import { decode } from "blurhash";
import { CSSProperties, useEffect, useState } from "react";

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
    style: styleProp,
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
    },[canvas,width,height,punch,hash]);

    style.root();

    return (
        <div style={styleProp} className={bcn(props,"HashBlurImage")}>
            <canvas ref={setCanvas}/>
        </div>
    )

}

const style=atDotCss({name:'HashBlurImage',order:'frameworkHigh',css:`
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
`});
