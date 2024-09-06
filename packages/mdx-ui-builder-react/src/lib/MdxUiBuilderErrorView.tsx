import { atDotCss } from "@iyio/at-dot-css";
import { BaseLayoutOuterProps } from "@iyio/common";
import { MdxUiBuilderError } from "@iyio/mdx-ui-builder";
import { Text, View } from "@iyio/react-common";

export interface MdxUiBuilderErrorViewProps
{
    error:MdxUiBuilderError;
}

export function MdxUiBuilderErrorView({
    error,
    ...props
}:MdxUiBuilderErrorViewProps & BaseLayoutOuterProps){

    return (
        <View col g050 p075 className={style.root(null,null,props)}>
            <Text sm colorMuted text="Compiler Error"/>
            {error.message}
        </View>
    )

}

const style=atDotCss({name:'MdxUiBuilderErrorView',css:`
    @.root{
        background-color:red;
        border-radius:4px;
        color:#ffffff;
    }
`});
