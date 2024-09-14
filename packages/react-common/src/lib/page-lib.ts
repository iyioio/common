import { createContext, useContext } from "react";
import { BehaviorSubject } from "rxjs/internal/BehaviorSubject";
import { useIncrementSubject } from "./rxjs-hooks";

export const commonPagePropsSubject=new BehaviorSubject<any>(undefined);

export const pageScrollPositionSubject=new BehaviorSubject<number>(0);

/**
 * Disable any page overflow clipping. This will also disable page scrolling
 */
export const disablePageClipSubject=new BehaviorSubject<number>(0);


export interface PageCtx<T=any>
{
    disablePageScrollSubject:BehaviorSubject<number>;
    common?:T;
}

export const PageContext=createContext<PageCtx|null>(null);

export const usePageCtx=<T=any>():PageCtx<T>=>{
    const ctx=useContext(PageContext);
    if(!ctx){
        throw new Error('usePageCtx used outside of PageContext.Provider');
    }
    return ctx;
}

export const useOptionalPageCtx=<T=any>():PageCtx<T>|null=>{
    return useContext(PageContext);
}

export const useCommonPageProps=<T=any>():T=>{
    return usePageCtx().common;
}

export const useDisablePageScroll=(enabled=true)=>{
    const ctx=useOptionalPageCtx();
    useIncrementSubject(ctx?.disablePageScrollSubject,enabled);
}

export const useDisablePageClip=(enabled=true)=>{
    useIncrementSubject(disablePageClipSubject,enabled);

}
