import { atDotCss } from "@iyio/at-dot-css";

export interface PdfViewerProps
{

}

export function PdfViewer({

}:PdfViewerProps){

    return (
        <div className={style.root()}>

            PdfViewer

        </div>
    )

}

const style=atDotCss({name:'PdfViewer',css:`
    @.root{
        display:flex;
        flex-direction:column;
    }
`});
