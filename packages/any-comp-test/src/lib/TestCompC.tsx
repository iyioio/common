import { atDotCss } from "@iyio/at-dot-css";
import { BaseLayoutProps } from "@iyio/common";
import { View } from '@iyio/react-common';

export interface TestCompCProps
{
    stringProp:string;
    numberProp:number;
    optStringProp?:string;
}

export function TestCompC({
    stringProp,
    numberProp,
    optStringProp='optional-value',
    ...props
}:TestCompCProps & BaseLayoutProps){

    return (
        <div className={style.root(null,null,props)}>

            <View col g1>
                TestCompC
                <View row g1>
                    <View>{stringProp}</View>
                    <View>{numberProp}</View>
                    <View>{optStringProp}</View>
                </View>
            </View>



        </div>
    )

}

const style=atDotCss({name:'TestCompC',css:`
    @.root{
        display:flex;
        flex-direction:column;
    }
`});
