import { defaultStyleSheetContainer } from "@iyio/common";
import { useSubject } from "@iyio/react-common";
import Head from "next/head";


export function NextJsStyleSheetRenderer()
{

    const sheets=useSubject(defaultStyleSheetContainer.sheetsSubject);

    return (
        <Head>
            <style id="iyio-NextJsStyleSheetRenderer">{Object.values(sheets).map(s=>s.css).join('\n')}</style>
        </Head>
    )

}
