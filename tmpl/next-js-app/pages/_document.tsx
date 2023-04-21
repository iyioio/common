import { DefaultStyleHead } from '@___$namespace___/___$compLib___';
import { Head, Html, Main, NextScript } from 'next/document';

export default function Document() {
    return (
        <Html>
            <Head>
                <DefaultStyleHead/>
            </Head>
            <body>
                <Main />
                <NextScript />
            </body>
        </Html>
    )
}
