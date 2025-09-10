import { NextJsApp } from '@iyio/nextjs-common';
import { AppProps } from 'next/app';
import Head from 'next/head';
import { ProtogenStyleSheet } from '../components/ProtogenStyleSheet.js';
import { protoFrontendModule } from '../lib/protoFrontendModule.js';


export default function App(props:AppProps){
    return (
        <NextJsApp
            appProps={props}
            GlobalStyle={ProtogenStyleSheet}
            scopeInit={protoFrontendModule}
            layoutProps={{
                pageTransitions:true,
            }}
        >
            <Head>
                <title>Protogen</title>
                <link rel="icon" type="image/png" href="/icon.png"></link>
            </Head>

        </NextJsApp>
    )
}
