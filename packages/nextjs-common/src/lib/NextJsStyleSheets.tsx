import Head from 'next/head';
import { Fragment } from 'react';
import { useNextJsStyleSheets, useWorkaroundForNextJsOutOfOrderStyleSheets } from './useSharedStyleSheets.internal.js';

export function NextJsStyleSheets(){
    const refresh=useWorkaroundForNextJsOutOfOrderStyleSheets();

    const sheets=useNextJsStyleSheets(refresh);

    return (
        <Head>
            <Fragment key={refresh}>
            {sheets}
            </Fragment>
        </Head>
    )

}
