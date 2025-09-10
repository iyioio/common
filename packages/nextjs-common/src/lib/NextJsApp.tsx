import { Scope } from "@iyio/common";
import { AppProps } from "next/app";
import { FunctionComponent, useCallback, useState } from "react";
import { DefaultLayout, DefaultLayoutProps } from "./DefaultLayout.js";
import { NextJsAppContainer, NextJsAppContainerProps } from "./NextJsAppContainer.js";
import { NextJsStyleSheets } from "./NextJsStyleSheets.js";
import { getRouteInfo } from "./next-route-helper.js";


export interface NextJsAppProps<TLayoutProps=DefaultLayoutProps> extends NextJsAppContainerProps
{
    LayoutComponent?:FunctionComponent<TLayoutProps>;
    layoutProps?:Omit<TLayoutProps,'routeInfo'>;
    appProps:AppProps;
    afterLayout?:any;
    GlobalStyle?:FunctionComponent;
    initBeforeRenderLayout?:boolean;
    componentOverride?:any;
}

export function NextJsApp({
    LayoutComponent=DefaultLayout,
    layoutProps={},
    appProps:{
        Component,
        pageProps,
        router,
    },
    componentOverride,
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
                    {componentOverride??<Component {...pageProps}/>}
                </LayoutComponent>
            }

            {afterLayout}

        </NextJsAppContainer>
    )

}
