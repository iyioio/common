import { atDotCss } from "@iyio/at-dot-css";
import { BaseLayoutColorProps, BaseLayoutFontProps, BaseLayoutProps, bcn, createJsonRefReplacer } from "@iyio/common";
import { useMemo } from "react";

interface JsonViewProps
{
    value?:any;
    whitespace?:number|string;
    replacer?:((this:any,key:string,value:any)=>any)|boolean;
    update?:any;
}

export function JsonView({
    value,
    whitespace=4,
    replacer,
    update,
    ...props
}:JsonViewProps & BaseLayoutProps & BaseLayoutFontProps & BaseLayoutColorProps){

    const json=useMemo<any>(()=>{
        if(value===undefined){
            return 'undefined'
        }
        try{
            const r=replacer===false?null:replacer===true?createJsonRefReplacer():(replacer);
            return JSON.stringify(value,r as any,whitespace);
        }catch(ex){
            return JSON.stringify({
                error:'Unable to stringify value - '+(ex as any)?.message,
            },null,whitespace);
        }
    },[value,whitespace,replacer,update]);

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
