import { atDotCss } from "@iyio/at-dot-css";
import { View, ViewProps } from "../View";

export interface AutoLayoutSlotProps
{
    children?:any;
    index:number;
}

export function AutoLayoutSlot({
    children,
    ...props
}:AutoLayoutSlotProps & ViewProps){

    return (
        <View {...props} className={style.root(null,null,props)}>

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
