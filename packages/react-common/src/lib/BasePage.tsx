import { BaseLayoutProps, bcn, cn, css, isServerSide } from "@iyio/common";
import { useEffect, useMemo, useState } from "react";
import Style from "styled-jsx/style";
import { commonPagePropsSubject, PageContext, PageCtx, pageScrollPositionSubject } from "./page-lib";

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
}

export function BasePage({
    common,
    children,
    scrollbarColor,
    scrollbarBgColor,
    unstyled,
    columnWidth,
    fullWidthColumn,
    disableScroll,
    ...props
}:BasePageProps){

    if(fullWidthColumn){
        columnWidth=undefined;
    }

    const ctx=useMemo<PageCtx>(()=>({
        common
    }),[common]);

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

    const customScrollbar=(scrollbarBgColor && scrollbarBgColor)?true:false;

    return (
        <PageContext.Provider value={ctx}>
            <div ref={setElem} className={cn("BasePage",{disableScroll})}>
                <main className={bcn(props,"BasePage-content",{fullWidthColumn},{
                    'BasePage-content-column':columnWidth
                })} style={{
                    maxWidth:columnWidth
                }}>
                    {children}
                </main>

                {!unstyled && <Style global id="iyio-BasePage-I8lytUEkoqJCVh5gXgCj" jsx>{css`
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

                    ${customScrollbar?css`
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
                    `:''}

                `}</Style>}
            </div>
        </PageContext.Provider>
    )

}
