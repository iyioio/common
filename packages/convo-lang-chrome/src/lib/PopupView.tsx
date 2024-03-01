import { atDotCss } from "@iyio/at-dot-css";
import { useDomSharedStyleSheets } from '@iyio/react-common';

export function PopupView(){

    useDomSharedStyleSheets();

    return (
        <div className={style.root()}>

            PopupView

        </div>
    )

}

const style=atDotCss({name:'PopupView',css:`
    @.root{
        display:flex;
        flex-direction:column;
        align-items:center;
        justify-content:center;
        flex:1;
        min-width:300px;
        min-height:500px;

    }
`});
