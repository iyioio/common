import { atDotCss } from "@iyio/at-dot-css";
import { Fragment } from "react";
import { AutoLayoutSlot } from "./AutoLayoutSlot";
import { AutoLayoutTypeProps } from "./auto-layout-lib";

export function AloExample({
    childAry,
}:AutoLayoutTypeProps){

    return (
        <Fragment>

            <AutoLayoutSlot flex1 index={0}>
                {childAry[0]}
            </AutoLayoutSlot>

        </Fragment>
    )

}

export const AloExampleStyle=atDotCss({name:'AloExample',namespace:'iyio',order:'framework',css:`
    @.root{
        flex-direction:row;
    }
`});
