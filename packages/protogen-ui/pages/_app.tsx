import { NextJsApp } from '@iyio/nextjs-common';
import { AppProps } from 'next/app';
import Head from 'next/head';
import { ProtogenStyleSheet } from '../components/ProtogenStyleSheet';
import { protoFrontendModule } from '../lib/protoFrontendModule';


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
            </Head>

        </NextJsApp>
    )
}
