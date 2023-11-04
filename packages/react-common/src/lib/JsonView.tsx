import { atDotCss } from "@iyio/at-dot-css";
import { BaseLayoutColorProps, BaseLayoutFontProps, BaseLayoutProps, bcn } from "@iyio/common";
import { useMemo } from "react";

interface JsonViewProps
{
    value?:any;
    whitespace?:number|string;
    replacer?:(this:any,key:string,value:any)=>any
}

export function JsonView({
    value,
    whitespace=4,
    replacer,
    ...props
}:JsonViewProps & BaseLayoutProps & BaseLayoutFontProps & BaseLayoutColorProps){

    const json=useMemo<any>(()=>{
        try{
            return JSON.stringify(value,replacer,whitespace);
        }catch(ex){
            return {
                error:'Unable to stringify value - '+(ex as any)?.message,
            }
        }
    },[value,whitespace,replacer]);

    style.root();

    return (
        <div className={bcn(props,"JsonView")}>{json}</div>
    )

}

const style=atDotCss({name:'JsonView',order:'frameworkHigh',css:`
    .JsonView{
        white-space:pre-wrap;
    }
`});
