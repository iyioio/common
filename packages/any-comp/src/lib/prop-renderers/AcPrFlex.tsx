import { atDotCss } from "@iyio/at-dot-css";
import { baseLayoutFlexProps } from "@iyio/common";
import { Text, useAlphaId } from "@iyio/react-common";
import { AnyCompViewCtrl } from "../AnyCompViewCtrl.js";
import { useUpdateOnAnyCompPropChange } from "../any-comp-react-lib.js";
import { AcProp } from "../any-comp-types.js";
import { getBaseLayoutInfo } from "./prop-render-lib.js";

export interface AcPrFlexProps
{
    ctrl:AnyCompViewCtrl;
    props:AcProp[];

}

export function AcPrFlex({
    ctrl,
    props
}:AcPrFlexProps){

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

    useUpdateOnAnyCompPropChange(ctrl,baseLayoutFlexProps);

    const id='flexValues-'+useAlphaId();

    let value=0;
    for(const e in baseLayoutFlexProps){
        if(cProps[e]){
            value=Number(e.substring('flex'.length));
        }
    }

    return (
        <div className={style.root()}>

            <Text opacity050 text="flex" mb050 />

            <input type="range" min={0} max={10} step={1} list={id} value={value} onChange={e=>{
                for(const e in baseLayoutFlexProps){
                    ctrl.setProp(e,undefined);
                }
                const n=Number(e.target.value);
                if(n){
                    ctrl.setProp(`flex${n}`,true);
                }
            }}/>

            <datalist id={id} className={style.datalist()}>
                <option value={0} label="0"/>
                {Array(10).fill(0).map((_,i)=>(
                    <option value={i+1} key={i} label={(i+1).toString()}/>
                ))}
            </datalist>

        </div>
    )

}

const style=atDotCss({namespace:'AnyComp',name:'AcPrFlex',css:`
    @.root{
        display:flex;
        flex-direction:column;
    }
    @.datalist{
        display: flex;
        font-size:10px;
        margin-left:4px;
    }
    @.datalist option{
        flex:1;
    }
`});
