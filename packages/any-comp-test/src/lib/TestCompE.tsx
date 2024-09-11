import { atDotCss } from "@iyio/at-dot-css";
import { View } from '@iyio/react-common';

export interface TestCompEProps
{
    stringProp:string;
    numberProp:number;
    optStringProp?:string;
}

export function TestCompE({
    stringProp,
    numberProp,
    optStringProp='optional-value'
}:TestCompEProps){

    return (
        <div className={style.root()}>

            <View col g1>
                TestCompE
                <View row g1>
                    <View>{stringProp}</View>
                    <View>{numberProp}</View>
                    <View>{optStringProp}</View>
                </View>
            </View>



        </div>
    )

}

const style=atDotCss({name:'TestCompE',css:`
    @.root{
        display:flex;
        flex-direction:column;
    }
`});
