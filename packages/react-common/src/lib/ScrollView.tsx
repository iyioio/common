import { atDotCss } from "@iyio/at-dot-css";
import { useEffect, useRef, useState } from "react";
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
    autoScrollEnd?:boolean;
    autoScrollTrigger?:any;
    autoScrollBehavior?:ScrollBehavior;
    autoScrollDelayMs?:number;
    autoScrollSelector?:string;
    autoScrollXOffset?:number;
    autoScrollYOffset?:number;
    containerFill?:boolean;

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
    autoScrollEnd,
    autoScrollTrigger,
    autoScrollBehavior='smooth',
    autoScrollDelayMs=100,
    elemRef,
    autoScrollSelector,
    autoScrollXOffset,
    autoScrollYOffset,
    containerFill,
    ...props
}:ScrollViewProps){

    const [root,setRoot]=useState<HTMLElement|null>(null);
    const [container,setContainer]=useState<HTMLElement|null>(null);
    const [overflowContainer,setOverflowContainer]=useState<HTMLElement|null>(null);

    const [rootSize]=useElementSize(containerFill?root:undefined);

    const [containerSize]=useElementSize(container);
    const {width,height}=containerSize;
    const sizeRef=useRef(containerSize);
    sizeRef.current=containerSize;

    const size=fitToMaxSize?containerSize:undefined;


    useEffect(()=>{
        if(autoScrollTrigger===undefined || !overflowContainer || !root){
            return;
        }

        const iv=setTimeout(()=>{
            autoScrollTo(
                root,
                direction,
                overflowContainer,
                sizeRef.current.width,
                sizeRef.current.height,
                autoScrollBehavior,
                autoScrollSelector,
                autoScrollXOffset,
                autoScrollYOffset,
            )
        },autoScrollDelayMs);

        return ()=>{
            clearTimeout(iv);
        }

    },[
        root,
        direction,
        autoScrollBehavior,
        autoScrollTrigger,
        overflowContainer,
        autoScrollDelayMs,
        autoScrollSelector,
        autoScrollXOffset,
        autoScrollYOffset,
    ]);

    useEffect(()=>{
        if(!autoScrollEnd || !overflowContainer || !root){
            return;
        }

        const iv=setTimeout(()=>{
            autoScrollTo(
                root,
                direction,
                overflowContainer,
                width,
                height,
                autoScrollBehavior,
                autoScrollSelector,
                autoScrollXOffset,
                autoScrollYOffset,
            )
        },autoScrollDelayMs);

        return ()=>{
            clearTimeout(iv);
        }

    },[
        root,
        width,
        height,
        direction,
        autoScrollBehavior,
        autoScrollEnd,
        overflowContainer,
        autoScrollDelayMs,
        autoScrollSelector,
        autoScrollXOffset,
        autoScrollYOffset,
    ]);

    const containerRef=containerProps?.elemRef;
    useEffect(()=>{
        containerRef?.(container);
    },[containerRef,container]);

    const containerMinWidth=containerProps?.style?.minWidth??(containerFill?rootSize.width:undefined);
    const containerMinHeight=containerProps?.style?.minHeight??(containerFill?rootSize.height:undefined)

    return (
        <View
            elemRef={v=>{elemRef?.(v);setRoot(v)}}
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

            <div ref={v=>{overflowRef?.(v);setOverflowContainer(v)}}>
                <View
                    row={row}
                    col={col}
                    className={style.container(null,[containerClassName,containerProps?.className])}
                    {...containerProps}
                    style={{
                        ...containerProps?.style,
                        minWidth:containerMinWidth,
                        minHeight:containerMinHeight,
                        [scrollViewContainerMinWidthCssVar as any]:containerMinWidth===undefined?undefined:containerMinWidth+'px',
                        [scrollViewContainerMinHeightCssVar as any]:containerMinHeight===undefined?undefined:containerMinHeight+'px',
                    }}
                    elemRef={(
                        fitToMaxSize ||
                        containerProps?.elemRef ||
                        autoScrollEnd ||
                        autoScrollTrigger!==undefined
                    )?setContainer:undefined}
                >
                    {children}
                </View>
            </div>
        </View>
    )

}

export const scrollViewContainerMinWidthCssVar='--scroll-view-container-min-width';
export const scrollViewContainerMinHeightCssVar='--scroll-view-container-min-height';

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
        overflow-y:hidden;
        overflow-y:clip;
        overflow-x:auto;
        overflow-x:overlay;
    }
    @.root.scroll-both > div{
        overflow-x:auto;
        overflow-y:overlay;
        overflow-y:auto;
        overflow-y:overlay;
    }
    @.container{
        position:relative;
    }

`});

const autoScrollTo=(
    root:HTMLElement,
    direction:ScrollViewDirection,
    overflowContainer:HTMLElement,
    width:number,
    height:number,
    autoScrollBehavior:ScrollBehavior,
    autoScrollSelector?:string,
    autoScrollXOffset=0,
    autoScrollYOffset=0,
)=>{

    if(autoScrollSelector){
        const elem=root.querySelector(autoScrollSelector);
        if(elem instanceof HTMLElement){
            overflowContainer.scrollTo({
                left:direction==='y'?0:elem.offsetWidth-root.offsetWidth+autoScrollXOffset,
                top:direction==='x'?0:elem.offsetHeight-root.offsetHeight+autoScrollYOffset,
                behavior:autoScrollBehavior
            })
            return;
        }
    }

    overflowContainer.scrollTo({
        left:width,
        top:height,
        behavior:autoScrollBehavior
    })
}
