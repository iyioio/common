import { atDotCss } from "@iyio/at-dot-css";
import { cn } from "@iyio/common";
import { useEffect, useState } from "react";
import { View, ViewProps } from "./View";
import { useElementSize } from "./useElementSize";

export type ScrollViewDirection='y'|'x'|'both';

export interface ScrollViewProps extends ViewProps
{
    containerProps?:ViewProps;
    containerClassName?:string;
    children?:any;
    direction?:ScrollViewDirection;
    overflowRef?:(elem:HTMLElement|null)=>void;
    fitToMaxSize?:string;
}

export function ScrollView({
    children,
    containerProps,
    containerClassName,
    className,
    direction='y',
    row,
    col,
    overflowRef,
    fitToMaxSize,
    ...props
}:ScrollViewProps){

    const [container,setContainer]=useState<HTMLElement|null>(null);

    const [size]=useElementSize(fitToMaxSize?container:undefined);

    const containerRef=containerProps?.elemRef;
    useEffect(()=>{
        containerRef?.(container);
    },[containerRef,container]);

    return (
        <View
            className={style.root({[`scroll-${direction}`]:true},className)}
            style={{
                maxHeight:(fitToMaxSize && (direction==='y'||direction==='both'))?fitToMaxSize:undefined,
                maxWidth:(fitToMaxSize && (direction==='x'||direction==='both'))?fitToMaxSize:undefined,
                height:(fitToMaxSize && size && (direction==='y'||direction==='both'))?size.height+'px':undefined,
                width:(fitToMaxSize && size && (direction==='x'||direction==='both'))?size.width+'px':undefined,
                ...props.style
            }}
            {...props}
        >

            <div ref={overflowRef}>
                <View
                    row={row}
                    col={col}
                    className={cn(containerClassName,containerProps?.className)}
                    {...containerProps}
                    elemRef={(fitToMaxSize || containerProps?.elemRef)?setContainer:undefined}
                >
                    {children}
                </View>
            </div>
        </View>
    )

}

const style=atDotCss({name:'ScrollView',css:`
    @.root{
        position:relative;
    }
    @.root.scroll-y > div{
        position:absolute;
        left:0;
        right:0;
        top:0;
        bottom:0;
    }
    @.root.scroll-y > div{
        overflow-x:hidden;
        overflow-x:clip;
        overflow-y:auto;
        overflow-y:overlay;
    }
    @.root.scroll-x > div{
        overflow-x:hidden;
        overflow-x:clip;
        overflow-y:auto;
        overflow-y:overlay;
    }
    @.root.scroll-both > div{
        overflow-x:auto;
        overflow-y:overlay;
        overflow-y:auto;
        overflow-y:overlay;
    }

`});
