import { AnyCompViewCtrl } from "../AnyCompViewCtrl.js";
import { AcProp } from "../any-comp-types.js";

export const getBaseLayoutInfo=(
    ctrl:AnyCompViewCtrl,
    props:AcProp[]
)=>{
    const cProps=ctrl.computedProps;
    const isCol=cProps['col']?true:false;
    const isRow=(cProps['row'] || (cProps['displayFlex'] && !isCol))?true:false;
    const isRowRev=cProps['rowReverse']?true:false;
    const isColRev=cProps['colReverse']?true:false;
    const centerBoth=cProps['centerBoth']?true:false;
    const wrap=cProps['flexWrap']?true:false;

    return {
        cProps,
        isCol,
        isRow,
        isRowRev,
        isColRev,
        centerBoth,
        wrap,
        rowLike:isRow || isRowRev,
        colLike:isCol || isColRev,
    }
}
