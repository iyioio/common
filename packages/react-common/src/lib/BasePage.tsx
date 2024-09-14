import { atDotCss } from "@iyio/at-dot-css";
import { BaseLayoutProps, bcn, cn, isServerSide, uiReadyDelayedSubject, uiReadySubject } from "@iyio/common";
import { CSSProperties, useEffect, useInsertionEffect, useMemo, useRef, useState } from "react";
import { BehaviorSubject } from "rxjs";
import { PageContext, PageCtx, commonPagePropsSubject, disablePageClipSubject, pageScrollPositionSubject } from "./page-lib";
import { useSubject } from "./rxjs-hooks";

export interface BasePageProps<T=any> extends BaseLayoutProps
{
    common?:T;
    children?:any;
    scrollbarColor?:string;
    scrollbarBgColor?:string;
    unstyled?:boolean;
    columnWidth?:number;
    fullWidthColumn?:boolean;
    disableScroll?:boolean;
    style?:CSSProperties;
    ready?:boolean;
    readyDelay?:number;
}

export function BasePage({
    common,
    children,
    scrollbarColor,
    scrollbarBgColor,
    unstyled,
    columnWidth,
    fullWidthColumn,
    disableScroll:disableScrollProp,
    style,
    ready=true,
    readyDelay=500,
    ...props
}:BasePageProps){

    if(fullWidthColumn){
        columnWidth=undefined;
    }

    const ctx=useMemo<PageCtx>(()=>({
        disablePageScrollSubject:new BehaviorSubject(0),
        common,
    }),[common]);

    const disableClip=useSubject(disablePageClipSubject);
    const disableScrollSubjectValue=useSubject(ctx.disablePageScrollSubject);
    const disableScroll=(disableScrollSubjectValue || disableScrollProp || disableClip)?true:false;


    const [elem,setElem]=useState<HTMLElement|null>(null);
    useEffect(()=>{
        if(isServerSide || !elem){
            return;
        }
        let m=true;

        const listener=()=>{
            if(!m){
                return;
            }
            pageScrollPositionSubject.next(elem.scrollTop);
        }
        listener();
        elem.addEventListener('scroll',listener);

        return ()=>{
            m=false;
            elem.removeEventListener('scroll',listener);
        }
    },[elem])

    useEffect(()=>{
        commonPagePropsSubject.next(common);
    },[common])

    const readDelayRef=useRef(readyDelay);
    useEffect(()=>{
        if(!ready){
            return
        }
        let m=true;

        setTimeout(()=>{
            if(!m){
                return;
            }
            if(!uiReadySubject.value){
                uiReadySubject.next(true);
            }
            setTimeout(()=>{
                if(!m){
                    return;
                }
                if(!uiReadyDelayedSubject.value){
                    uiReadyDelayedSubject.next(true);
                }
            },3000);
        },Math.max(1,readDelayRef.current));

        return ()=>{m=false}
    },[ready])

    const customScrollbar=(scrollbarBgColor && scrollbarBgColor)?true:false;

    if(!unstyled){
        cStyle.root();
    }

    useInsertionEffect(()=>{
        if(!customScrollbar){
            return;
        }
        atDotCss({name:'BasePage-customScrollBar',order:'frameworkHigh',css:`
            .BasePage{
                scrollbar-color: ${scrollbarColor} ${scrollbarBgColor};
            }
            .BasePage::-webkit-scrollbar{
                width:5px;
            }
            .BasePage::-webkit-scrollbar-track {
                background: ${scrollbarBgColor};
            }
            .BasePage::-webkit-scrollbar-thumb {
                background-color: ${scrollbarColor};
                border-radius:2.5px;
                cursor:pointer;
            }

        `}).root();
    },[customScrollbar])

    return (
        <PageContext.Provider value={ctx}>
            <div ref={setElem} className={cn("BasePage",{disableScroll,disableClip})} style={style}>
                <main className={bcn(props,"BasePage-content",{fullWidthColumn},{
                    'BasePage-content-column':columnWidth
                })} style={{
                    maxWidth:columnWidth
                }}>
                    {children}
                </main>
            </div>
        </PageContext.Provider>
    )

}

const cStyle=atDotCss({name:'BasePage',order:'frameworkHigh',css:`
    .BasePage{
        position:absolute;
        left:0;
        top:0;
        right:0;
        bottom:0;
        overflow-y:auto;
        overflow-y:overlay;
        overflow-x:hidden;
        overflow-x:clip;
        scroll-behavior:smooth;
        z-index:1;
    }
    .BasePage.disableScroll{
        overflow-y:hidden;
        overflow-y:clip;
    }
    .BasePage.disableClip{
        overflow-y:visible;
        overflow-y:visible;
        overflow-x:visible;
    }
    .BasePage-content{
        display:flex;
        flex-direction:column;
        min-height:100%;
    }
    .disableScroll .BasePage-content{
        height:100%;
    }
    .BasePage-content-column{
        margin-left:auto;
        margin-right:auto;
    }
`});
