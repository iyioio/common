import { atDotCss } from "@iyio/at-dot-css";
import { Fragment } from "react";
import { AutoLayoutSlot } from "./AutoLayoutSlot";
import { AutoLayoutTypeProps } from "./auto-layout-lib";

export function AloQuad({
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

            <AutoLayoutSlot flex1 index={2}>
                {childAry[2]}
            </AutoLayoutSlot>

            <AutoLayoutSlot flex1 index={3}>
                {childAry[3]}
            </AutoLayoutSlot>

        </Fragment>
    )

}

export const AloQuadStyle=atDotCss({name:'AloQuad',namespace:'iyio',order:'framework',css:`
    @.root{
        display:grid !important;
        grid-template-columns:1fr 1fr;
    }
`});
