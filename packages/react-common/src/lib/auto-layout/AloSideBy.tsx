import { atDotCss } from "@iyio/at-dot-css";
import { Fragment } from "react";
import { AutoLayoutSlot } from "./AutoLayoutSlot.js";
import { AutoLayoutTypeProps } from "./auto-layout-lib.js";

export function AloSideBy({
    childAry,
}:AutoLayoutTypeProps){

    return (
        <Fragment>

            <AutoLayoutSlot flex1 index={0}>
                {childAry[0]}
            </AutoLayoutSlot>

            <AutoLayoutSlot flex1 index={1}>
                {childAry[1]}
            </AutoLayoutSlot>

        </Fragment>
    )

}

export const AloSideByStyle=atDotCss({name:'AloSideBy',namespace:'iyio',order:'framework',css:`
    @.root{
        flex-direction:row;
    }
`});
