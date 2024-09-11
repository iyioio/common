import { atDotCss } from "@iyio/at-dot-css";
import { BaseLayoutProps } from "@iyio/common";
import { View } from '@iyio/react-common';


export function TestCompD({
    ...props
}:BaseLayoutProps){

    return (
        <div className={style.root(null,null,props)}>

            <View col g1>
                TestCompD
                <View row g1>
                    <View>{JSON.stringify(props)}</View>
                </View>
            </View>



        </div>
    )

}

const style=atDotCss({name:'TestCompD',css:`
    @.root{
        display:flex;
        flex-direction:column;
    }
`});
