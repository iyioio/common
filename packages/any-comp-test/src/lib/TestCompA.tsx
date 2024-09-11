import { atDotCss } from "@iyio/at-dot-css";
import { BaseLayoutProps, Point } from "@iyio/common";
import { View } from '@iyio/react-common';

type OtherUnion='p'|'k';

const allAnimals=['cat','dog','fish'] as const;
type Animal=typeof allAnimals[number];

type X=Record<Animal,string>;

type MyDude={
    car:'fast'|'slow'
} & BaseLayoutProps


export interface TestCompAProps //extends BaseLayoutProps
{
    optStringProp?:string;
    /**
     * General comment
     * - item 1
     * - item 2
     * @someTag cool stuff here
     *          wrap this tag content
     */
    stringProp:string;
    staticStr:'static';
    numberProp:number;
    union1?:'a'|'b'|1|false;
    union2:'j'|OtherUnion|(keyof Point);
    callback:(value:any)=>void;
}

export function TestCompA({
    stringProp,
    numberProp,
    optStringProp='optional-value'
}:TestCompAProps & X & MyDude){

    return (
        <div className={style.root()}>

            <View col g1>
                TestCompA
                <View row g1>
                    <View>{stringProp}</View>
                    <View>{numberProp}</View>
                    <View>{optStringProp}</View>
                </View>
            </View>



        </div>
    )

}

const style=atDotCss({name:'TestCompA',css:`
    @.root{
        display:flex;
        flex-direction:column;
    }
`});
