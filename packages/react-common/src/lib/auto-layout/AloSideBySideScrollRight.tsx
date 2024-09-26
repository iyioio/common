import { atDotCss } from "@iyio/at-dot-css";
import { baseLayoutGapProps, getObjKeyIntersection } from "@iyio/common";
import { Fragment } from "react";
import { ScrollView } from "../ScrollView";
import { AutoLayoutSlot } from "./AutoLayoutSlot";
import { AutoLayoutTypeProps } from "./auto-layout-lib";

export function AloSideBySideScrollRight({
    childAry,
    layoutProps,
}:AutoLayoutTypeProps){

    return (
        <Fragment>

            <AutoLayoutSlot flex1 index={0}>
                {childAry[0]}
            </AutoLayoutSlot>

            <ScrollView flex1 containerProps={{
                col:true,
                ...getObjKeyIntersection(layoutProps,baseLayoutGapProps)
            }}>
                {childAry.map((c,i)=>i===0?null:(
                    <AutoLayoutSlot flex1 index={i} key={i}>
                        {c}
                    </AutoLayoutSlot>
                ))}
            </ScrollView>

        </Fragment>
    )

}

export const AloSideBySideScrollRightStyle=atDotCss({name:'AloSideBySideScrollRight',namespace:'iyio',order:'framework',css:`
    @.root{
        flex-direction:row;
    }
`});
