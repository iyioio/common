import { atDotCss } from "@iyio/at-dot-css";
import { BaseLayoutProps, baseLayoutPaddingProps, takeObjKeyIntersection } from "@iyio/common";
import { CSSProperties, Children, useState } from "react";
import { useSwipe } from "./useSwipe";

export interface SliderViewProps
{
    index?:number;
    onChangeIndex?:(index:number)=>void;
    vertical?:boolean;
    children?:any;
    style?:CSSProperties;
}

export function SliderView({
    onChangeIndex,
    index:indexProp,
    vertical,
    children,
    style:styleProp,
    ...props
}:SliderViewProps & BaseLayoutProps){

    const childAry=Children.toArray(children);
    const count=childAry.length;

    const [_index,_setIndex]=useState(indexProp??0);
    const index=indexProp??_index;
    const setIndex=(i:number)=>{
        _setIndex(i);
        onChangeIndex?.(i);
    }

    const setSwipeElem=useSwipe((dir)=>{
        if(vertical){
            if(dir==='up'){
                if(index<count-1){
                    setIndex(index+1);
                }
            }else if(dir==='down'){
                if(index>0){
                    setIndex(index-1);
                }
            }
        }else{
            if(dir==='left'){
                if(index<count-1){
                    setIndex(index+1);
                }
            }else if(dir==='right'){
                if(index>0){
                    setIndex(index-1);
                }
            }
        }
    });

    const innerProps=takeObjKeyIntersection(props,baseLayoutPaddingProps);

    return (
        <div ref={setSwipeElem} className={style.root({vertical},null,props)} style={{...style.vars({
            count,
            index,
        }),...styleProp}}>

            <div className={style.plane({vertical})}>
                {childAry.map((child,i)=>(
                    <div key={i} className={style.slide({vertical},null,innerProps)} style={style.vars({slideIndex:i})}>
                        {child}
                    </div>
                ))}
            </div>

        </div>
    )

}

const style=atDotCss({name:'SliderView',namespace:'iyio',order:'framework',css:`
    @.root{
        position:relative;
        overflow:hidden;
        overflow:clip;
    }
    @.plane{
        position:absolute;
        left:0;
        top:0;
        height:100%;
        width:calc( 100% * @@count );
        transition:transform 0.3s ease-in-out;
        transform:translateX( calc( 100% / @@count * @@index * -1 ) );
    }
    @.plane.vertical{
        height:calc( 100% * @@count );
        width:100%;
        transform:translateY( calc( 100% / @@count * @@index * -1 ) );
    }
    @.slide{
        display:flex;
        flex-direction:column;
        position:absolute;
        overflow:hidden;
        left:calc( 100% / @@count * @@slideIndex );
        width:calc( 100% / @@count );
        top:0;
        height:100%;
    }
    @.slide.vertical{
        top:calc( 100% / @@count * @@slideIndex );
        height:calc( 100% / @@count );
        left:0;
        width:100%;
    }
`});
