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
    className?:string;
    errorClassName?:string;
    count?:number;
    errors?:(CodeParsingError|number)[];
    pad?:any;
    disableColors?:boolean;
}

/**
 * @acIgnore
 */
export function LineNumbers({
    className,
    errorClassName,
    count=1,
    errors,
    pad,
    disableColors,
}:LineNumbersProps){

    const lines:any[]=[];

    for(let i=1;i<=count;i++){
        lines.push(<span className={(errors && isLineError(i,errors))?style.error(null,errorClassName):undefined} key={i}>{i}</span>)
    }


    return (
        <div className={style.root({colors:!disableColors},className)}>
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
        padding:0 0.5rem;
        font-family:Courier !important;
    }
    @.root.colors{
        border-right:${dt().foreground}18 1px solid;
    }
    @.root > *{
        opacity:0.5;
    }
    @.first{
        height:0;
        max-height:0;
    }
    @.error{
        opacity:1;
    }
    @.root.colors @.error{
        color:${dt().dangerColor};
    }
`});
