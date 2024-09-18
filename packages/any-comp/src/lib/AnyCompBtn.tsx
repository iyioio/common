import { atDotCss } from "@iyio/at-dot-css";
import { ButtonBase, ButtonBaseProps } from "@iyio/react-common";
import { AnyCompIcon, AnyCompIconType } from "./AnyCompIcon";
import { acStyle } from "./any-comp-style";

export interface AnyCompBtnProps extends ButtonBaseProps
{
    icon?:AnyCompIconType;
    active?:boolean;
}

export function AnyCompBtn({
    icon,
    className,
    active,
    ...props
}:AnyCompBtnProps){

    return (
        <ButtonBase {...props} className={style.root({active},className,props)}>

            {!!icon && <AnyCompIcon icon={icon} />}

        </ButtonBase>
    )

}

const style=atDotCss({namespace:'AnyComp',name:'AnyCompBtn',css:`
    @.root{
        display:flex;
        padding:0.5rem;
        border-radius:${acStyle.var('borderRadius')};
        border:${acStyle.var('borderDefault')};
        background:none;
        cursor:pointer;
    }
    @.root.active{
        border-color:${acStyle.var('activeColor')};
    }
`});
