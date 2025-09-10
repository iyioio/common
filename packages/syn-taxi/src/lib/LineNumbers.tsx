import { atDotCss } from "@iyio/at-dot-css";
import { CodeParsingError } from "@iyio/common";
import { dt } from "./lib-design-tokens.js";

const isLineError=(line:number,errors:(CodeParsingError|number)[]):boolean=>{
    for(let i=0;i<errors.length;i++){
        const e=errors[i];
        if(e && e===line || (e as CodeParsingError).lineNumber===line){
            return true;
        }
    }
    return false;
}

export interface LineNumbersProps
{
    count?:number;
    errors?:(CodeParsingError|number)[];
    pad?:any;
}

/**
 * @acIgnore
 */
export function LineNumbers({
    count=1,
    errors,
    pad
}:LineNumbersProps){

    const lines:any[]=[];

    for(let i=1;i<=count;i++){
        lines.push(<span className={(errors && isLineError(i,errors))?style.error():undefined} key={i}>{i}</span>)
    }


    return (
        <div className={style.root()}>
            <span className={style.first()}>&nbsp;&nbsp;&nbsp;</span>
            {lines}
            {pad}
        </div>
    )

}

const style=atDotCss({name:'LineNumbers',css:`
    @.root{
        display:flex;
        flex-direction:column;
        align-items:flex-end;
        font-size:${dt().codeFontSize}px !important;
        line-height:${dt().codeLineHeight}px !important;
        border-right:${dt().foreground}18 1px solid;
        padding:0 0.5rem;
        font-family:Courier !important;
    }
    @.root > *{
        opacity:0.5;
    }
    @.first{
        height:0;
        max-height:0;
    }
    @.error{
        color:${dt().dangerColor};
        opacity:1;
    }
`});
