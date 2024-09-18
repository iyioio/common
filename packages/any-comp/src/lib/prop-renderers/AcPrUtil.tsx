import { atDotCss } from "@iyio/at-dot-css";
import { baseLayoutInnerFlexProps } from "@iyio/common";
import { AnyCompViewCtrl } from "../AnyCompViewCtrl";
import { useUpdateOnAnyCompPropChange } from "../any-comp-react-lib";
import { AcProp } from "../any-comp-types";
import { getBaseLayoutInfo } from "./prop-render-lib";

export interface AcPrUtilProps
{
    ctrl:AnyCompViewCtrl;
    props:AcProp[];

}

export function AcPrUtil({
    ctrl,
    props,
}:AcPrUtilProps){

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

            AcPrUtil

        </div>
    )

}

const style=atDotCss({namespace:'AnyComp',name:'AcPrUtil',css:`
    @.root{
        display:flex;
        flex-direction:column;
    }
`});
