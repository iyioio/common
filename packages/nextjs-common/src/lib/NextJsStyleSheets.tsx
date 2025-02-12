import Head from 'next/head';
import { useNextJsStyleSheets, useWorkaroundForNextJsOutOfOrderStyleSheets } from './useSharedStyleSheets.internal';

export function NextJsStyleSheets(){
    const refresh=useWorkaroundForNextJsOutOfOrderStyleSheets();

    const sheets=useNextJsStyleSheets(refresh);

    return (
        <Head>
            {sheets}
        </Head>
    )

}
