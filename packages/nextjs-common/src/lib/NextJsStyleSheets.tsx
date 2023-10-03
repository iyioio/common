import Head from 'next/head';
import { useNextJsStyleSheets } from './useSharedStyleSheets.internal';

export function NextJsStyleSheets(){

    const sheets=useNextJsStyleSheets();

    return (
        <Head>
            {sheets}
        </Head>
    )

}
