import { atDotCss } from "@iyio/at-dot-css";
import { BaseLayoutProps } from "@iyio/common";
import { View, useCreateDirectionInputCtrl, useDirectionCount, useDirectionIndex, useDirectionIndexRequest, useDirectionInput, useElementSize, useSubject, useSwipe } from "@iyio/react-common";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ViewportCtrl } from "./ViewportCtrl";
import { ViewportCtrlReactContext } from "./viewport-lib";

export interface ViewportProps
{
    horizontal?:boolean;
    transTime?:string;
    clip?:boolean;
    background?:any;
    before?:any;
    children?:any;
    after?:any;
    foreground?:any;
    foregroundPointerEventsNone?:boolean;
    backgroundPointerEventsNone?:boolean;
    index?:number;
}

export function Viewport({
    horizontal,
    transTime='0.4s',
    clip,
    background,
    before,
    children,
    after,
    foreground,
    backgroundPointerEventsNone,
    foregroundPointerEventsNone,
    row,
    index:indexProp,
    ...props
}:ViewportProps & BaseLayoutProps){

    const ctrl=useMemo(()=>new ViewportCtrl(),[]);
    const stages=useSubject(ctrl.surfacesSubject);


    const index=useSubject(ctrl.indexSubject);
    useEffect(()=>{
        if(indexProp!==undefined){
            ctrl.index=indexProp;
        }
    },[ctrl,indexProp]);

    const navLocked=useSubject(ctrl.navLockCountSubject)>0;
    const setIndex=useCallback((index:number)=>{
        if(navLocked){
            return;
        }
        ctrl.index=index;
    },[ctrl,navLocked]);

    const count=stages.length;

    const [viewportElem,setViewportElem]=useState<HTMLElement|null>(null);

    const dirCtrl=useCreateDirectionInputCtrl();

    useDirectionIndex(index,dirCtrl);
    useDirectionCount(count,dirCtrl);
    useDirectionIndexRequest(setIndex,dirCtrl);
    useDirectionInput(dir=>{
        if(dir==='right' && index<count-1){
            setIndex(index+1);
        }else if(dir==='left' && index>0){
            setIndex(index-1);
        }
    },dirCtrl)
    useSwipe(dirCtrl,undefined,undefined,viewportElem);

    const [size]=useElementSize(viewportElem);

    return (
        <ViewportCtrlReactContext.Provider value={ctrl}>
            <div className={viewportStyle.root({horizontal,row},null,props)} style={viewportStyle.vars({
                width:size.width+'px',
                height:size.height+'px',
                index,
                count,
                transTime,
            })}>
                {!!background && <View absFill col pointerEventsNone={backgroundPointerEventsNone}>
                    {background}
                </View>}
                {!!before && <View posRel col>{before}</View>}
                <div className={viewportStyle.viewport({clip})} ref={setViewportElem}>
                    <div className={viewportStyle.plane({horizontal})}>
                        {children}
                    </div>
                </div>
                {!!after && <View posRel col>{after}</View>}
                {!!foreground && <View absFill col pointerEventsNone={foregroundPointerEventsNone}>
                    {foreground}
                </View>}
            </div>
        </ViewportCtrlReactContext.Provider>
    )

}

export const viewportStyle=atDotCss({name:'Viewport',order:'framework',namespace:'iyio',css:`
    @.root{
        display:flex;
        flex-direction:column;
        position:relative;
    }
    @.root.row{
        flex-direction:row;
    }
    @.root.horizontal{
        flex-direction:row;
    }
    @.viewport{
        flex:1;
        display:flex;
        flex-direction:column;
        position:relative;
    }
    @.viewport.clip{
        overflow:hidden;
        overflow:clip;
    }
    @.plane{
        display:flex;
        flex-direction:column;
        position:absolute;
        left:0;
        top:0;
        width:@@width;
        height:@@height * @@count;
        transform:translate(0, calc( @@height * @@index * -1 ) );
        transition:transform @@transTime ease-in-out;
    }
    @.plane.horizontal{
        transform:translate(calc( @@width * @@index * -1 ), 0 );
        flex-direction:row;
        width:@@width * @@count;
        height:@@height;
    }
    @.stage{
        display:flex;
        flex-direction:column;
        position:absolute;
        width:@@width;
        height:@@height;
        left:0;
        top:calc( @@height * @@stageIndex );
    }
    @.stage.clip{
        overflow:hidden;
        overflow:clip;
    }
    @.stage.active{}
    @.plane.horizontal @.stage{
        top:0;
        left:calc( @@width * @@stageIndex );
    }
`});

const hideJson=true;
