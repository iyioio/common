import { Scope } from "@iyio/common";
import { AppProps } from "next/app";
import { FunctionComponent, useCallback, useState } from "react";
import { DefaultLayout, DefaultLayoutProps } from "./DefaultLayout";
import { NextJsAppContainer, NextJsAppContainerProps } from "./NextJsAppContainer";
import { NextJsStyleSheets } from "./NextJsStyleSheets";
import { getRouteInfo } from "./next-route-helper";


export interface NextJsAppProps<TLayoutProps=DefaultLayoutProps> extends NextJsAppContainerProps
{
    LayoutComponent?:FunctionComponent<TLayoutProps>;
    layoutProps?:Omit<TLayoutProps,'routeInfo'>;
    appProps:AppProps;
    afterLayout?:any;
    GlobalStyle?:FunctionComponent;
    initBeforeRenderLayout?:boolean;
}

export function NextJsApp({
    LayoutComponent=DefaultLayout,
    layoutProps={},
    appProps:{
        Component,
        pageProps,
        router,
    },
    children,
    afterLayout,
    GlobalStyle,
    afterAll,
    initBeforeRenderLayout,
    onScopeInited,
    ...props
}:NextJsAppProps){

    const [inited,setInited]=useState(false);
    const renderLayout=initBeforeRenderLayout?inited:true;

    const _onScopeInited=useCallback((scope:Scope)=>{

        setInited(true);

        onScopeInited?.(scope)
    },[onScopeInited])


    return (
        <NextJsAppContainer
            onScopeInited={_onScopeInited}
            {...props}
            afterAll={<>
                {GlobalStyle && <GlobalStyle/>}
                <NextJsStyleSheets/>
                {afterAll}
            </>}
        >
            {children}

            {renderLayout &&
                <LayoutComponent routeInfo={getRouteInfo(router)} {...layoutProps}>
                    <Component {...pageProps}/>
                </LayoutComponent>
            }

            {afterLayout}

        </NextJsAppContainer>
    )

}
