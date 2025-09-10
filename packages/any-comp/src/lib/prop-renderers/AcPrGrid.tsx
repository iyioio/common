import { atDotCss } from "@iyio/at-dot-css";
import { baseLayoutInnerFlexProps } from "@iyio/common";
import { AnyCompViewCtrl } from "../AnyCompViewCtrl.js";
import { useUpdateOnAnyCompPropChange } from "../any-comp-react-lib.js";
import { AcProp } from "../any-comp-types.js";
import { getBaseLayoutInfo } from "./prop-render-lib.js";

export interface AcPrGridProps
{
    ctrl:AnyCompViewCtrl;
    props:AcProp[];

}

export function AcPrGrid({
    ctrl,
    props,
}:AcPrGridProps){

    const {
        cProps,
        isCol,
        isRow,
        isRowRev,
        isColRev,
        centerBoth,
        wrap,
        colLike,
        rowLike,
    }=getBaseLayoutInfo(ctrl,props);

    useUpdateOnAnyCompPropChange(ctrl,baseLayoutInnerFlexProps);

    return (
        <div className={style.root()}>

            AcPrGrid

        </div>
    )

}

const style=atDotCss({namespace:'AnyComp',name:'AcPrGrid',css:`
    @.root{
        display:flex;
        flex-direction:column;
    }
`});
