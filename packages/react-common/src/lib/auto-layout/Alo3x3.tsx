import { atDotCss } from "@iyio/at-dot-css";
import { Fragment } from "react";
import { AutoLayoutSlot } from "./AutoLayoutSlot";
import { AutoLayoutTypeProps } from "./auto-layout-lib";

export function Alo3x3({
    childAry,
}:AutoLayoutTypeProps){

    return (
        <Fragment>

            {childAry.map((c,i)=>i>=9?null:(
                <AutoLayoutSlot flex1 index={i} key={i}>
                    {c}
                </AutoLayoutSlot>
            ))}

        </Fragment>
    )

}

export const Alo3x3Style=atDotCss({name:'Alo3x3',namespace:'iyio',order:'framework',css:`
    @.root{
        display:grid !important;
        grid-template-columns:1fr 1fr 1fr;
        grid-template-rows:1fr 1fr 1fr;
    }
`});