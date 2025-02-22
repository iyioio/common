import Head from 'next/head';
import { Fragment } from 'react/jsx-runtime';
import { useNextJsStyleSheets, useWorkaroundForNextJsOutOfOrderStyleSheets } from './useSharedStyleSheets.internal';

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
