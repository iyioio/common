import { atDotCss } from "@iyio/at-dot-css";
import { BaseLayoutOuterProps, domListener } from "@iyio/common";
import { useEffect, useRef } from "react";
import { SlimButton } from "./SlimButton";
import { Text } from "./Text";
import { useDirectionCount, useDirectionIndex, useDirectionInputCtrl } from "./direction-input/direction-input-lib";
import { BasicIcon } from "./icon/BasicIcon";
import { useSwipe } from "./useSwipe";

export interface PageArrowsProps
{
    count?:number;
    index?:number;
    onChange?:(index:number)=>void;
    listenToKeys?:boolean;
    enableSwipe?:boolean|HTMLElement;
    disabled?:boolean;
    disableDirectionCtrlInput?:boolean;
}

export function PageArrows({
    count,
    index,
    onChange:onChangeProp,
    listenToKeys,
    enableSwipe,
    disabled,
    disableDirectionCtrlInput,
    ...props
}:PageArrowsProps & BaseLayoutOuterProps){

    const ctrlIndex=useDirectionIndex();
    const ctrlCount=useDirectionCount();

    if(count===undefined){
        count=ctrlCount;
    }

    if(index===undefined){
        index=ctrlIndex;
    }

    const dirCtrl=useDirectionInputCtrl();
    const onChange=(i:number)=>{
        if(i===index){
            return;
        }

        if(dirCtrl && !disableDirectionCtrlInput){
            dirCtrl.triggerInput(i>(index??0)?'left':'right');
        }

        onChangeProp?.(i);
    }
    const refs=useRef({count,onChange,index,disabled});
    refs.current.count=count;
    refs.current.onChange=onChange;
    refs.current.index=index;
    refs.current.disabled=disabled;

    useEffect(()=>{
        if(!listenToKeys){
            return;
        }

        return domListener().keyDownEvt.addListenerWithDispose(e=>{
            if(e.inputElem || refs.current.disabled){
                return;
            }
            switch(e.key){

                case 'ArrowRight':
                    if(refs.current.index<refs.current.count-1){
                        refs.current.onChange?.(refs.current.index+1);
                    }
                    break;

                case 'ArrowLeft':
                    if(refs.current.index>0){
                        refs.current.onChange?.(refs.current.index-1);
                    }
                    break;

            }
        });

    },[listenToKeys]);

    const setSwipe=useSwipe((dir)=>{
        if(refs.current.disabled){
            return;
        }
        switch(dir){
            case 'left':
                if(refs.current.index<refs.current.count-1){
                    refs.current.onChange?.(refs.current.index+1);
                }
                break;
            case 'right':
                if(refs.current.index>0){
                    refs.current.onChange?.(refs.current.index-1);
                }
                break;

        }
    });

    useEffect(()=>{
        if(!setSwipe || !enableSwipe){
            return;
        }
        let elem=enableSwipe
        if(elem===true){
            elem=document.body;
        }
        setSwipe(elem);
        return ()=>{
            setSwipe(null);
        }
    },[setSwipe,enableSwipe]);

    return (
        <div className={style.root(null,null,props)}>

            <BasicIcon transOpacity opacity025={index<1 && !disabled} opacity0={disabled} color="#ffffff" icon="chevron-left"/>

            <Text className={style.text()} singleLine flex1 centerText text={`${index+1}/${count}`}/>

            <BasicIcon transOpacity opacity025={index>=count-1 && !disabled} opacity0={disabled} color="#ffffff" icon="chevron-right"/>

            {index>0 && !disabled && <SlimButton
                className={style.left()}
                onClick={index>0?()=>onChange?.((index??0)-1):undefined}
            />}
            {index<count-1 && !disabled && <SlimButton
                className={style.right()}
                onClick={index<count-1?()=>onChange?.((index??0)+1):undefined}
            />}
        </div>
    )

}

const style=atDotCss({name:'PageArrows',namespace:'iyio',order:'frameworkHigh',css:`
    @.root{
        position:relative;
        display:flex;
        background-color:#00000099;
        border-radius:15px;
        height:30px;
        width:75px;
        align-items:center;
        justify-content:space-between;
        padding:0 7px;
        font-size:11px;
    }
    @.left{
        position:absolute;
        left:-0.5rem;
        right:50%;
        top:-0.5rem;
        bottom:-0.5rem;
    }
    @.right{
        position:absolute;
        left:50%;
        right:-0.5rem;
        top:-0.5rem;
        bottom:-0.5rem;
    }
    @.text{
        color:#ffffff;
    }

`});
