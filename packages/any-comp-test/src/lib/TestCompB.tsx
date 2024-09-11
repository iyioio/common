import { atDotCss } from "@iyio/at-dot-css";
import { BaseLayoutProps } from "@iyio/common";
import { View } from '@iyio/react-common';

export interface TestCompBProps extends BaseLayoutProps
{
    stringProp:string;
    numberProp:number;
    optStringProp?:string;
}

export function TestCompB({
    stringProp,
    numberProp,
    optStringProp='optional-value',
    ...props
}:TestCompBProps){

    return (
        <div className={style.root(null,null,props)}>

            <View col g1>
                TestCompB
                <View row g1>
                    <View>{stringProp}</View>
                    <View>{numberProp}</View>
                    <View>{optStringProp}</View>
                </View>
            </View>



        </div>
    )

}

const style=atDotCss({name:'TestCompB',css:`
    @.root{
        display:flex;
        flex-direction:column;
    }
`});
