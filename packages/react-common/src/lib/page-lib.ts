import { createContext, useContext } from "react";
import { BehaviorSubject } from "rxjs/internal/BehaviorSubject";

export const commonPagePropsSubject=new BehaviorSubject<any>(undefined);

export const pageScrollPositionSubject=new BehaviorSubject<number>(0);


export interface PageCtx<T=any>
{
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

export const useCommonPageProps=<T=any>():T=>{
    return usePageCtx().common;
}
