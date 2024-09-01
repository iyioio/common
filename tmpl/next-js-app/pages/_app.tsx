import { DefaultGlobalStyle, MainLayout, PageWrapper } from '@___$namespace___/___$compLib___';
import { ___$frontendModule___, defaultBaseLayoutStyleSheetProps, st } from '@___$namespace___/___$frontendLib___';
import { STATIC_ENV_VARS, __macro__ } from '@iyio/common';
import { NextJsApp } from '@iyio/nextjs-common';
import { AppProps } from 'next/app';
import Head from 'next/head';

export default function App(props:AppProps){
    return (
        <NextJsApp
            appProps={props as any}
            style={defaultBaseLayoutStyleSheetProps}
            GlobalStyle={DefaultGlobalStyle}
            scopeInit={___$frontendModule___}
            staticEnvVars={process.env['NODE_ENV']==='production'?undefined:__macro__(STATIC_ENV_VARS)}
            layoutProps={{
                pageTransitions:true,
                LayoutWrapper:MainLayout,
                PageWrapper
            }}
        >
            <Head>
                <title>___$siteTitle___</title>
                <meta name="theme-color" content={st.bgColor}/>
                <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no"/>
                <link rel="icon" type="image/png" href="/logo-icon.png"></link>
                <meta property="og:title" content="___$siteTitle___" />
                <meta property="og:description" content="___$siteDescription___" />
                <meta property="og:type" content="website" />
                <meta property="og:image" content={`https://${process.env['NX_PUBLIC_FRONTEND_DOMAIN']}/logo.png`} />
                <meta property="og:url" content={`https://${process.env['NX_PUBLIC_FRONTEND_DOMAIN']}/`} />
            </Head>

        </NextJsApp>
    )
}
