import Head from 'next/head';
import { useNextJsStyleSheets, useWorkaroundForNextJsOutOfOrderStyleSheets } from './useSharedStyleSheets.internal';

export function NextJsStyleSheets(){

    const sheets=useNextJsStyleSheets();

    const refresh=useWorkaroundForNextJsOutOfOrderStyleSheets();
    if(refresh){
        return null;
    }

    return (
        <Head>
            {sheets}
        </Head>
    )

}
