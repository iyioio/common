import { BaseLayoutOuterProps, BaseLayoutProps, bcn, cn, css, strFirstToUpper } from "@iyio/common";
import { Children, useCallback, useEffect, useRef, useState } from "react";
import Style from "styled-jsx/style";
import { BasicIcon } from "./icon/BasicIcon";
import { SwipeDirection, useSwipe } from "./useSwipe";

export interface CarouselItem
{
    key:string|number;
    render?:(itemIndex:number,activeIndex:number,item:CarouselItem)=>any;
    view?:any;
    data?:any;
}

interface CarouselProps extends BaseLayoutOuterProps
{
    /**
     * Items to render as the children of the carousel. Do not use both items and children. Items
     * override children
     */
    items?:CarouselItem[];

    /**
     * Each child will be rendered as a section of the carousel. Do not use both items and children.
     * items override children.
     */
    children?:any;

    /**
     * The current index of the carousel
     */
    index?:number;

    /**
     * Called when the index of the carousel changes.
     */
    onIndexChange?:(index:number)=>void;

    /**
     * A class added the class list of the wrapper elements that wraps each item.
     */
    wrapperClass?:string;

    /**
     * Layout properties applied to each item wrapper
     */
    wrapperLayout?:BaseLayoutProps;

    /**
     * If true the carousel will be vertically oriented. It is horizontally oriented by default.
     */
    vertical?:boolean;

    /**
     * If true the carousel will flex to fill the available size.
     */
    fill?:boolean;

    /**
     * If true or a render function indicators will be rendered. By default the indicators are
     * small dots, but a custom indicator renderer can be supplied to render custom indicators.
     */
    indicators?:boolean|((itemIndex:number,activeIndex:number,item:CarouselItem)=>any);

    /**
     * If true or a render function is supplied directional arrows will be rendered
     */
    arrows?:boolean|((vertical:boolean,start:boolean,disabled:boolean,size:number)=>any);

    /**
     * Controls the size of the arrow icons
     */
    arrowSize?:number;

    /**
     * Controls how much padding it added to the arrow buttons
     */
    arrowPadding?:number|string;

    /**
     * A class name given to the arrow buttons
     */
    arrowClassName?:string;


    /**
     * Size used when rendering the default indicator dots.
     */
    indicatorSize?:number;

    /**
     * Controls where the indicators are rendered. When horizontal start positions the indicators
     * at the top and end at the bottom of the carousel, when vertical start positions the
     * indicators on the left and end on the right of the carousel.
     */
    indicatorsPosition?:'start'|'end';

    /**
     * If defined the value will control how much margin is used to separate the indicators from
     * the content of the carousel. By default indicatorSize plus 16 will be used as a pixel value.
     */
    indicatorMargin?:string;

    /**
     * Can be used to assign a custom css class to either the items of the carousel or the indicators.
     */
    getItemClass?:(itemIndex:number,activeIndex:number,item:CarouselItem,forDot:boolean)=>string|null|undefined;

    /**
     * Can be used to render an overlay on top of the carousel.
     */
    overlay?:any;

    /**
     * If true and the carousel has 1 or less items the indicators will be hidden
     */
    hideSingleIndicator?:boolean;

}

export function Carousel({
    index,
    onIndexChange,
    items,
    wrapperClass,
    children,
    vertical=false,
    wrapperLayout={},
    indicators:_indicators,
    hideSingleIndicator,
    arrows,
    arrowSize=18,
    arrowClassName,
    arrowPadding=0,
    indicatorsPosition='end',
    indicatorSize=8,
    indicatorMargin,
    overlay,
    fill,
    getItemClass,
    ...props
}:CarouselProps){

    const isControlled=index!==undefined && onIndexChange===undefined;

    if(!items && children){
        items=Children.map(children,(child,index)=>({
            key:index,
            view:child
        }))
    }
    if(!items){
        items=[];
    }
    const itemsRef=useRef(items);
    itemsRef.current=items;

    const indicators=hideSingleIndicator?items.length<2?undefined:_indicators:_indicators;

    const indicatorRenderer=(typeof indicators === 'function')?indicators:undefined;
    const arrowRenderer=(typeof arrows === 'function')?arrows:undefined;

    const [_activeIndex,setActiveIndex]=useState(index??0);
    const activeIndex=isControlled?index:Math.max(0,Math.min(_activeIndex,items.length-1));

    useEffect(()=>{
        onIndexChange?.(activeIndex);
    },[onIndexChange,activeIndex]);

    const onSwipe=useCallback((e:SwipeDirection)=>{
        if(isControlled){
            return;
        }
        setActiveIndex(v=>{
            switch(e){

                case 'right':
                    if(!vertical && v>0){
                        v--;
                    }
                    break;

                case 'left':
                    if(!vertical && v<itemsRef.current.length-1){
                        v++;
                    }
                    break;
            }
            return v;
        })
    },[vertical,isControlled])

    const setSwipeRoot=useSwipe(onSwipe);

    const indicatorSide=vertical?
        (indicatorsPosition==='start'?'left':'right'):
        (indicatorsPosition==='start'?'top':'bottom');

    return (
        <div ref={setSwipeRoot} className={bcn(props,"Carousel",{vertical,horizontal:!vertical,fill},indicatorsPosition)}>

            <div className="Carousel-plane" style={{
                [vertical?'height':'width']:100*items.length+'%',
                transform:`translate${vertical?'Y':'X'}(-${100/items.length*activeIndex}%)`,
                ['margin'+strFirstToUpper(indicatorSide)]:indicators?indicatorMargin?indicatorMargin:(indicatorSize+16)+'px':undefined,
            }}>
                {items.map((item,index)=>(
                    <div key={item.key} className={bcn(
                        wrapperLayout,
                        "Carousel-itemWrapper",
                        wrapperClass,
                        {active:index===activeIndex},
                        getItemClass?.(index,activeIndex,item,false),
                    )} style={{
                        [vertical?'height':'width']:100/(items?.length??0)+'%',
                    }}>
                        {item.render?item.render(index,activeIndex,item):item.view}
                    </div>
                ))}
            </div>

            {indicators && <div className="Carousel-indicators">
                {items.map((item,index)=>(
                    <button key={item.key} onClick={()=>setActiveIndex(index)} className={cn(
                        "Carousel-indicatorButton",
                        {active:index===activeIndex},
                        getItemClass?.(index,activeIndex,item,true),
                    )}>
                        {indicatorRenderer?indicatorRenderer(index,activeIndex,item):(
                            <div className="Carousel-indicator" role="presentation" style={{
                                width:indicatorSize,
                                height:indicatorSize,
                            }}/>
                        )}
                    </button>

                ))}
            </div>}

            {arrows && <>
                <button
                    className={cn("Carousel-arrow start",arrowClassName)}
                    disabled={activeIndex<=0}
                    onClick={()=>setActiveIndex(activeIndex-1)}
                    style={{padding:arrowPadding}}
                >
                    {(arrowRenderer??defaultArrowRenderer)(vertical,true,activeIndex<=0,arrowSize)}
                </button>
                <button
                    className={cn("Carousel-arrow end",arrowClassName)}
                    disabled={activeIndex>=items.length-1}
                    onClick={()=>setActiveIndex(activeIndex+1)} style={{padding:arrowPadding}}
                >
                    {(arrowRenderer??defaultArrowRenderer)(vertical,false,activeIndex>=items.length-1,arrowSize)}
                </button>
            </>}

            {overlay}

            <Style global id="Carousel-ttFB0Is4geE41tWXLeBK" jsx>{css`
                .Carousel{
                    display:flex;
                    flex-direction:column;
                    position:relative;
                }
                .Carousel.horizontal{
                    overflow-x:hidden;
                    overflow-x:clip;
                }
                .Carousel.fill{
                    flex:1;
                }
                .Carousel.vertical{
                    overflow-y:hidden;
                    overflow-y:clip;
                }
                .Carousel-plane{
                    transition:transform 0.2s ease-in-out;
                }
                .Carousel.horizontal.fill .Carousel-plane{
                    height:100%;
                }
                .Carousel.vertical.fill .Carousel-plane{
                    width:100%;
                }
                .Carousel.horizontal .Carousel-plane{
                    display:flex;
                    flex-direction:row;
                }
                .Carousel.vertical .Carousel-plane{
                    display:flex;
                    flex-direction:column;
                }
                .Carousel-itemWrapper{
                    display:flex;
                    position:relative;
                }
                .Carousel.horizontal .Carousel-itemWrapper{
                    flex-direction:column;
                }
                .Carousel-indicators{
                    gap:0.5rem;
                    position:absolute;
                    justify-content:center;
                }
                .Carousel.horizontal .Carousel-indicators{
                    display:flex;
                    flex-direction:row;
                    width:100%;
                }
                .Carousel.horizontal.start .Carousel-indicators{
                    top:0;
                }
                .Carousel.horizontal.end .Carousel-indicators{
                    bottom:0;
                }
                .Carousel.vertical .Carousel-indicators{
                    display:flex;
                    flex-direction:column;
                    height:100%;
                }
                .Carousel.vertical.start .Carousel-indicators{
                    left:0;
                }
                .Carousel.vertical.end .Carousel-indicators{
                    right:0;
                }
                .Carousel-indicatorButton{
                    border:none;
                    background:none;
                    padding:0;
                    margin:0;
                    cursor:pointer;
                }
                .Carousel-indicator{
                    background-color:#fff;
                    border-radius:50%;
                    box-shadow:2px 2px 3px #00000044;
                    opacity:0.7;
                    transition:opacity 0.2s ease-in-out;
                }
                .Carousel-indicatorButton.active .Carousel-indicator{
                    opacity:1;
                }
                .Carousel-arrow{
                    border:none;
                    background:none;
                    padding:0;
                    margin:0;
                    cursor:pointer;
                    position:absolute;
                }
                .Carousel.horizontal .Carousel-arrow.start{
                    left:0;
                    top:50%;
                    transform:translateY(-50%);
                }
                .Carousel.horizontal .Carousel-arrow.end{
                    right:0;
                    top:50%;
                    transform:translateY(-50%);
                }
                .Carousel.vertical .Carousel-arrow.start{
                    top:0;
                    left:50%;
                    transform:translateX(-50%);
                }
                .Carousel.vertical .Carousel-arrow.end{
                    bottom:0;
                    left:50%;
                    transform:translateX(-50%);
                }
                .Carousel-defaultArrows{
                    opacity:1;
                    transition:opacity 0.2s ease-in-out;
                    filter:drop-shadow(2px 2px 4px #000000);
                }
                .Carousel-defaultArrows.disabled{
                    opacity:0;
                    pointer-events:none;
                }
                .Carousel-defaultArrows path{
                    fill:#fff;
                }
            `}</Style>
        </div>
    )

}

const defaultArrowRenderer=(vertical:boolean,start:boolean,disabled:boolean,size:number)=>(
    <>
        <BasicIcon size={size} className={cn("Carousel-defaultArrows",{disabled})} icon={vertical?
            (start?'chevron-up':'chevron-down'):
            (start?'chevron-left':'chevron-right')
        } />
    </>
)
