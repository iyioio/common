import { atDotCss } from "@iyio/at-dot-css";
import { BaseLayoutProps } from "@iyio/common";
import { acStyle } from "./any-comp-style";

export interface AnyCompInputShellProps
{
    children?:any;
}

export function AnyCompInputShell({
    children,
    ...props
}:AnyCompInputShellProps & BaseLayoutProps){

    return (
        <div className={style.root(null,null,props)}>

            {children}

        </div>
    )

}

const style=atDotCss({name:'AnyCompInputShell',css:`
    @.root{
        display:flex;
        border:${acStyle.var('borderDefault')};
        border-radius:${acStyle.var('borderRadius')};
        background-color:${acStyle.var('inputBg')};
    }
`});
