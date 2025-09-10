import { atDotCss } from "@iyio/at-dot-css";
import { Fragment } from "react";
import { AutoLayoutSlot } from "./AutoLayoutSlot.js";
import { AutoLayoutTypeProps } from "./auto-layout-lib.js";

export function AloTriBottom({
    childAry,
}:AutoLayoutTypeProps){

    return (
        <Fragment>

            <AutoLayoutSlot flex1 index={1}>
                {childAry[1]}
            </AutoLayoutSlot>

            <AutoLayoutSlot flex1 index={2}>
                {childAry[2]}
            </AutoLayoutSlot>

            <AutoLayoutSlot className={AloTriBottomStyle.tip()} flex1 index={0}>
                {childAry[0]}
            </AutoLayoutSlot>

        </Fragment>
    )

}

export const AloTriBottomStyle=atDotCss({name:'AloTriBottom',namespace:'iyio',order:'framework',css:`
    @.root{
        display:grid !important;
        grid-template-columns:1fr 1fr;
    }
    @.tip{
        grid-column:span 2;
    }
`});
