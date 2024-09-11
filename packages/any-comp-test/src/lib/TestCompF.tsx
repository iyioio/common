import { atDotCss } from "@iyio/at-dot-css";
import { BaseLayoutProps } from "@iyio/common";
import { View } from '@iyio/react-common';

export interface TestCompFProps<T>
{
    value:T;
    value2?:T;
    onChange?:(value:T)=>void;
    autoConnect?:boolean|'no'|'yes';
}

export function TestCompF<T>({
    value,
    onChange
}:TestCompFProps<T> & BaseLayoutProps){

    return (
        <div className={style.root()}>

            <View col g1>
                TestCompF
                <View row g1>
                    <View>{value}</View>
                    <View>{onChange?'onChange':'undefined'}</View>
                </View>
            </View>



        </div>
    )

}

const style=atDotCss({name:'TestCompF',css:`
    @.root{
        display:flex;
        flex-direction:column;
    }
`});
