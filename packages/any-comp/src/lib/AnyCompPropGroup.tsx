import { atDotCss } from "@iyio/at-dot-css";
import { AnyCompViewCtrl } from "./AnyCompViewCtrl";
import { AcProp } from "./any-comp-types";

export interface AnyCompPropGroupProps
{
    ctrl:AnyCompViewCtrl;
    props:AcProp;
}

export function AnyCompPropGroup({

}:AnyCompPropGroupProps){

    return (
        <div className={style.root()}>

            AnyCompPropGroup

        </div>
    )

}

const style=atDotCss({namespace:'AnyComp',name:'AnyCompPropGroup',css:`
    @.root{
        display:flex;
        flex-direction:column;
    }
`});
