import { cn, css, isServerSide } from "@iyio/common";
import { useEffect, useMemo, useState } from "react";
import Style from "styled-jsx/style";
import { commonPagePropsSubject, PageContext, PageCtx, pageScrollPositionSubject } from "./page-lib";

export interface BasePageProps<T=any>
{
    common?:T;
    children?:any;
    scrollbarColor?:string;
    scrollbarBgColor?:string;
}

export function BasePage({
    common,
    children,
    scrollbarColor,
    scrollbarBgColor,
}:BasePageProps){

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


    return (
        <PageContext.Provider value={ctx}>
            <div ref={setElem} className={cn("BasePage")}>
                <main className="BasePage-content">
                    {children}
                </main>

                <Style global id="iyio-BasePage-I8lytUEkoqJCVh5gXgCj" jsx>{css`
                    .Page{
                        position:absolute;
                        left:0;
                        top:0;
                        right:0;
                        bottom:0;
                        overflow-y:auto;
                        overflow-y:overlay;
                        overflow-x:hidden;
                        scroll-behavior:smooth;
                        z-index:1;
                        scrollbar-color: ${scrollbarColor} ${scrollbarBgColor};
                    }
                    .Page::-webkit-scrollbar{
                        width:5px;
                    }
                    .Page::-webkit-scrollbar-track {
                        background: ${scrollbarBgColor};
                    }
                    .Page::-webkit-scrollbar-thumb {
                        background-color: ${scrollbarColor};
                        border-radius:2.5px;
                        cursor:pointer;
                    }
                `}</Style>
            </div>
        </PageContext.Provider>
    )

}
