import { atDotCss } from "@iyio/at-dot-css";
import { BaseLayoutProps } from "@iyio/common";

const ar=41/10;

export interface LoadingDotsProps
{
    disabled?:boolean;
    size?:string|number;
    inset?:number;
    className?:string;
    fill?:boolean;
    color?:string;
}

export function LoadingDots({
    disabled,
    size='0.625rem',
    inset=0,
    className,
    fill,
    color,
    ...props
}:LoadingDotsProps & BaseLayoutProps){

    const content=(
        <svg
            className={style.root({disabled},className,props)}
            style={style.vars({size:(typeof size === 'number')?size+'px':size,color} as any)}
            viewBox={inset?`${-inset} ${-inset} ${41+inset*2} ${10+inset*2}`:"0 0 41 10"}
            fill="none"
        >
            <circle style={style.vars({order:0})} cx="5.76367" cy="5" r="5"/>
            <circle style={style.vars({order:1})} cx="20.7637" cy="5" r="5"/>
            <circle style={style.vars({order:2})} cx="35.7637" cy="5" r="5"/>
        </svg>
    )

    if(fill){
        return (
            <div className={style.fill()}>
                {content}
            </div>
        )
    }else{
        return content;
    }

}

const style=atDotCss({name:'LoadingDots',namespace:'iyio',order:'framework',css:`

    @keyframes @@@dot{
        0%{opacity:0.5}
        50%{opacity:0.2}
        100%{opacity:0.5}
    }

    @.root{
        pointer-events:none;
        height:@@size;
        width:calc( @@size * ${ar} )
    }

    @.root circle{
        animation:@@@dot 1s ease-in-out infinite;
        animation-delay: calc(@@order * 150ms);
        fill:var(--iyio--LoadingDots-color,var(--iyio-LoadingDots-color,#ffffff))
    }

    @.root.disabled circle{
        animation-play-state:paused;
    }

    @.fill{
        display:flex;
        justify-content:center;
        align-items:center;
        flex:1;
        padding:0.5rem;
    }
`});
