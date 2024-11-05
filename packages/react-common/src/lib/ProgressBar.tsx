import { atDotCss } from "@iyio/at-dot-css";
import { BaseLayoutOuterProps } from "@iyio/common";

export interface ProgressBarProps
{
    value?:number;
    color?:string;
}

export function ProgressBar({
    value=0,
    color='#ffffff',
    ...props
}:ProgressBarProps & BaseLayoutOuterProps){

    return (
        <div className={style.root(null,null,props)} style={style.vars({color})}>

            <div className={style.fill()} style={{transform:`scaleX(${value})`}}/>

        </div>
    )

}

const style=atDotCss({name:'ProgressBar',css:`
    @.root{
        display:flex;
        height:0.5rem;
        border-radius:1000px;
        border:1px solid @@color;
        overflow:hidden;
        position:relative;
    }
    @.fill{
        position:absolute;
        width:1px;
        height:100%;
        width:100%;
        left:0;
        top:0;
        transform-origin:0 0;
        background-color:@@color;
        transition:transform 0.2s ease-in-out;
    }
`});
