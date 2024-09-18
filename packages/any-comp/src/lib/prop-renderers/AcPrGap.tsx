import { atDotCss } from "@iyio/at-dot-css";
import { baseLayoutGapProps } from "@iyio/common";
import { Text, useAlphaId } from "@iyio/react-common";
import { AnyCompViewCtrl } from "../AnyCompViewCtrl";
import { useUpdateOnAnyCompPropChange } from "../any-comp-react-lib";
import { AcProp } from "../any-comp-types";
import { getBaseLayoutInfo } from "./prop-render-lib";

export interface AcPrGapProps
{
    ctrl:AnyCompViewCtrl;
    props:AcProp[];

}

export function AcPrGap({
    ctrl,
    props
}:AcPrGapProps){

    const {
        cProps,
    }=getBaseLayoutInfo(ctrl,props);

    useUpdateOnAnyCompPropChange(ctrl,baseLayoutGapProps);

    const id='gapValues-'+useAlphaId();

    let value=0;
    for(const e in baseLayoutGapProps){
        if(cProps[e]){
            value=Number(e.substring('g'.length));
        }
    }

    return (
        <div className={style.root()}>

            <Text opacity050 text="gap" mb050 />

            <input type="range" min={0} max={10} step={1} list={id} value={value} onChange={e=>{
                for(const e in baseLayoutGapProps){
                    ctrl.setProp(e,undefined);
                }
                const n=Number(e.target.value);
                if(n){
                    ctrl.setProp(`g${n}`,true);
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

const style=atDotCss({namespace:'AnyComp',name:'AcPrGap',css:`
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
