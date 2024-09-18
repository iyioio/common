import { atDotCss } from "@iyio/at-dot-css";
import { baseLayoutInnerFlexProps } from "@iyio/common";
import { AnyCompViewCtrl } from "../AnyCompViewCtrl";
import { useUpdateOnAnyCompPropChange } from "../any-comp-react-lib";
import { AcProp } from "../any-comp-types";
import { getBaseLayoutInfo } from "./prop-render-lib";

export interface AcPrSelfAlignmentProps
{
    ctrl:AnyCompViewCtrl;
    props:AcProp[];

}

export function AcPrSelfAlignment({
    ctrl,
    props,
}:AcPrSelfAlignmentProps){

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

            AcPrSelfAlignment

        </div>
    )

}

const style=atDotCss({namespace:'AnyComp',name:'AcPrSelfAlignment',css:`
    @.root{
        display:flex;
        flex-direction:column;
    }
`});
