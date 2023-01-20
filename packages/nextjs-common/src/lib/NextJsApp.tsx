import { AppProps } from "next/app";
import { FunctionComponent } from "react";
import { DefaultLayout, DefaultLayoutProps } from "./DefaultLayout";
import { getRouteInfo } from "./next-route-helper";
import { NextJsAppContainer, NextJsAppContainerProps } from "./NextJsAppContainer";


export interface NextJsAppProps<TLayoutProps=DefaultLayoutProps> extends NextJsAppContainerProps
{
    LayoutComponent?:FunctionComponent<TLayoutProps>;
    layoutProps?:Omit<TLayoutProps,'routeInfo'>;
    appProps:AppProps;
    afterLayout?:any;
    GlobalStyle?:FunctionComponent;
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
    ...props
}:NextJsAppProps){

    return (
        <NextJsAppContainer
            {...props}
            afterAll={<>
                {GlobalStyle && <GlobalStyle/>}
                {afterAll}
            </>}
        >

            {children}

            <LayoutComponent routeInfo={getRouteInfo(router)} {...layoutProps}>
                <Component {...pageProps}/>
            </LayoutComponent>

            {afterLayout}

        </NextJsAppContainer>
    )

}
