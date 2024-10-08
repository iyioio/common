import { atDotCss } from "@iyio/at-dot-css";
import { Fragment } from "react";
import { AutoLayoutSlot } from "./AutoLayoutSlot";
import { AutoLayoutTypeProps } from "./auto-layout-lib";

export function AloAutoGrid({
    childAry,
}:AutoLayoutTypeProps){

    return (
        <Fragment>

            {childAry.map((c,i)=>(
                <AutoLayoutSlot flex1 index={i} key={i}>
                    {c}
                </AutoLayoutSlot>
            ))}

        </Fragment>
    )

}

export const AloAutoGridStyle=atDotCss({name:'AloAutoGrid',namespace:'iyio',order:'framework',css:`
    @.root{
        display:grid !important;
        grid-template-columns:repeat(auto-fit,minmax( @@minSize ,1fr));
    }
`});

export const getAloAutoGridStyleVars=(props:AutoLayoutTypeProps):any=>{
    return AloAutoGridStyle.vars({minSize:props.slotOptions.maxSize??'200px'})
}
