import { atDotCss } from "@iyio/at-dot-css";
import { BaseLayoutProps } from "@iyio/common";
import { CSSProperties, useEffect, useState } from "react";
import { useLazyRender } from "./useLazyRender";

export interface VideoProps
{
    alt?:string;
    title?:string;
    src?:string;
    controls?:boolean;
    contain?:boolean;
    style?:CSSProperties;
    children?:any;
    tile?:boolean;
    elemRef?:(elem:HTMLElement|null)=>void;
    videoRef?:(elem:HTMLVideoElement|null)=>void;
    lazy?:boolean;
    loop?:boolean;
    muted?:boolean;
    autoPlay?:boolean;
    sq?:boolean;
    landscape?:boolean;
    portrait?:boolean;
    aspectRatio?:string|number;
}

export function Video({
    alt,
    src,
    title,
    contain,
    style:styleProp,
    elemRef,
    videoRef,
    children,
    controls=false,
    tile,
    lazy,
    loop,
    muted,
    autoPlay,
    sq,
    landscape,
    portrait,
    aspectRatio=landscape?'16/9':portrait?'9/16':sq?1:undefined,
    ...props
}:VideoProps & BaseLayoutProps){

    const [root,setRoot]=useState<HTMLElement|null>(null);

    useEffect(()=>{
        elemRef?.(root);
    },[root,elemRef]);

    const {show}=useLazyRender(lazy?root:null);

    return (
        <div
            title={title}
            ref={setRoot}
            role="img"
            aria-label={alt}
            className={style.root(null,null,props)}
            style={{aspectRatio,...styleProp}}
        >
            {(!lazy || show) && <>
                <video
                    ref={videoRef}
                    className={style.video({contain})}
                    controls={controls}
                    src={src}
                    loop={loop}
                    muted={muted}
                    autoPlay={autoPlay}
                />
                {children}
            </>}
        </div>
    )

}

const style=atDotCss({name:'Video',css:`
    @.root{
        display:flex;
        flex-direction:column;
        position:relative;
        overflow:hidden;
    }
    @.video{
        position:absolute;
        left:0;
        top:0;
        width:100%;
        height:100%;
        object-fit:cover;
    }
    @.video.contain{
        object-fit:contain;
    }

`});
