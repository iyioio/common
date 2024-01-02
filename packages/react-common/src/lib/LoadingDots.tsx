import { atDotCss } from "@iyio/at-dot-css";

export interface LoadingDotsProps
{
    className?:string;
    disabled?:boolean;
    absCenter?:boolean;
}

export function LoadingDots({
    className,
    disabled,
    absCenter,
}:LoadingDotsProps){

    return (
        <svg className={style.root({disabled,absCenter},className)} width="41" height="10" viewBox="0 0 41 10" fill="none">
            <circle style={style.vars({order:0})} cx="5.76367" cy="5" r="5" fill="white"/>
            <circle style={style.vars({order:1})} cx="20.7637" cy="5" r="5" fill="white"/>
            <circle style={style.vars({order:2})} cx="35.7637" cy="5" r="5" fill="white"/>
        </svg>
    )

}

const style=atDotCss({name:'LoadingDots',css:`

    @keyframes @@@dot{
        0%{opacity:0.5}
        50%{opacity:0.2}
        100%{opacity:0.5}
    }

    @.root{
        pointer-events:none;
    }

    @.root circle{
        animation:@@@dot 1s ease-in-out infinite;
        animation-delay: calc(@@order * 150ms);
    }

    @.root.disabled circle{
        animation-play-state:paused;
    }

    @.root.absCenter{
        position:absolute;
        left:50%;
        top:50%;
        transform:translate(-50%,-50%);
    }
`});
