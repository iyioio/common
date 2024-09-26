import { atDotCss } from "@iyio/at-dot-css";
import { UIEvent, useEffect, useRef, useState } from "react";
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
    autoScrollEndFilter?:()=>boolean;
    autoScrollTrigger?:any;
    autoScrollBehavior?:ScrollBehavior;
    autoScrollDelayMs?:number;
    autoScrollSelector?:string;
    autoScrollXOffset?:number;
    autoScrollYOffset?:number;
    containerFill?:boolean;
    containerCol?:boolean;
    onScroll?:(e:UIEvent<HTMLElement>)=>void;
    /**
     * When true the children of the scroll view will be returned by passing the scroll view layout
     * completely. When set to keepContainers the layout of the scroll view will be changed so that
     * it acts as a non-scrolling container but will prevent the children of the scroll view from
     * being remounted when switching between modes.
     */
    byPass?:boolean|'keepContainers';

    /**
     * If true and by passing is enabled but not true all of the elements of the scroll view will
     * be flex columns with a flex value set to 1.
     */
    byPassFlex1?:boolean;
}

export function ScrollView({
    children,
    containerProps,
    containerClassName,
    containerCol,
    className,
    direction='y',
    row,
    col,
    overflowRef,
    fitToMaxSize,
    autoScrollEnd,
    autoScrollEndFilter,
    autoScrollTrigger,
    autoScrollBehavior='smooth',
    autoScrollDelayMs=100,
    elemRef,
    autoScrollSelector,
    autoScrollXOffset,
    autoScrollYOffset,
    containerFill,
    byPass,
    byPassFlex1,
    onScroll,
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

    const refs=useRef({autoScrollEndFilter});
    refs.current.autoScrollEndFilter=autoScrollEndFilter;


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
                refs.current.autoScrollEndFilter,
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
                refs.current.autoScrollEndFilter,
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
    const containerMinHeight=containerProps?.style?.minHeight??(containerFill?rootSize.height:undefined);

    if(byPass===true){
        return children;
    }

    return (
        <View
            elemRef={v=>{elemRef?.(v);setRoot(v)}}
            className={byPass?
                style.byPassRoot({byPassFlex1},className):
                style.root({[`scroll-${direction}`]:true},className)
            }
            style={{
                maxHeight:(fitToMaxSize && (direction==='y'||direction==='both'))?fitToMaxSize:undefined,
                maxWidth:(fitToMaxSize && (direction==='x'||direction==='both'))?fitToMaxSize:undefined,
                height:(fitToMaxSize && size && (direction==='y'||direction==='both'))?size.height+'px':undefined,
                width:(fitToMaxSize && size && (direction==='x'||direction==='both'))?size.width+'px':undefined,
                ...props.style
            }}
            {...props}
        >

            <div
                onScroll={onScroll}
                className={byPass?style.byPassOverflow({byPassFlex1}):undefined}
                ref={v=>{overflowRef?.(v);setOverflowContainer(v)}}
            >
                <View
                    row={row}
                    col={col}
                    className={byPass?
                        style.byPassContainer({byPassFlex1}):
                        style.container({col:containerCol},[containerClassName,containerProps?.className])
                    }
                    {...containerProps}
                    style={byPass?containerProps?.style:{
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

const style=atDotCss({name:'ScrollView',order:'framework',css:`
    @.root{
        position:relative;
        max-width:100%;
        max-height:100%;
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
    @.container.col{
        display:flex;
        flex-direction:column;
    }


    @.byPassRoot{
        position:relative;
    }
    @.byPassRoot.byPassFlex1{
        display:flex;
        flex-direction:column;
        flex:1;
    }
    @.byPassOverflow.byPassFlex1{
        display:flex;
        flex-direction:column;
        flex:1;
    }
    @.byPassContainer.byPassFlex1{
        display:flex;
        flex-direction:column;
        flex:1;
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
    autoScrollEndFilter:(()=>boolean)|undefined=undefined,
)=>{

    if(autoScrollEndFilter?.()===false){
        return;
    }

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
