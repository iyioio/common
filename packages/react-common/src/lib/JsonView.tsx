import { BaseLayoutColorProps, BaseLayoutFontProps, BaseLayoutProps, bcn } from "@iyio/common";
import { useMemo } from "react";
import Style from "styled-jsx/style";

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

    return (
        <div className={bcn(props,"JsonView")}>{json}<Style global jsx>{`
            .JsonView{
                white-space:pre;
            }
        `}</Style></div>
    )

}
