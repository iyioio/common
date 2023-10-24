import { atDotCss } from "@iyio/at-dot-css";
import { dt } from "./lib-design-tokens";

export interface LineNumbersProps
{
    count?:number;
    lineErrors?:number[]|number;
}

export function LineNumbers({
    count=1,
    lineErrors
}:LineNumbersProps){

    const lines:any[]=[];

    if(typeof lineErrors === 'number'){
        lineErrors=[lineErrors];
    }

    for(let i=1;i<=count;i++){
        lines.push(<span className={(lineErrors && lineErrors.includes(i))?style.error():undefined} key={i}>{i}</span>)
    }

    return (
        <div className={style.root()}>
            <span className={style.first()}>&nbsp;&nbsp;&nbsp;</span>
            {lines}
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
        padding-right:0.5rem;
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
