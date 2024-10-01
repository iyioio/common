import { atDotCss } from "@iyio/at-dot-css";
import { CSSProperties } from "react";
import { View, ViewProps } from "../View";

export interface AutoLayoutSlotProps
{
    children?:any;
    index:number;
    style?:CSSProperties;
}

/**
 * @acIgnore
 */
export function AutoLayoutSlot({
    children,
    style:styleProp,
    ...props
}:AutoLayoutSlotProps & ViewProps){

    return (
        <View {...props} className={style.root(null,null,props)} style={styleProp}>

            {children}

        </View>
    )

}

const style=atDotCss({name:'AutoLayoutSlot',namespace:'iyio',order:'framework',css:`
    @.root{
        display:flex;
        flex-direction:column;
        position:relative;
    }
`});
