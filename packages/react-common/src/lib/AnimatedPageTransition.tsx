import { atDotCss } from "@iyio/at-dot-css";
import { cn, css, RouteInfo } from "@iyio/common";
import { useInsertionEffect } from "react";
import { disablePageClipSubject } from "./page-lib";
import { PageTransition } from "./PageTransition";
import { PageTransitionOptions } from "./PageTransitionOptions";
import { useSubject } from "./rxjs-hooks";

export const defaultAnimatedPageTransitionKeyframes=css`
    @keyframes PageTransitionEnter
    {
        0%{
            opacity:0;
        }
        100%{
            opacity:1;
        }
    }
    @keyframes PageTransitionExit
    {
        0%{
            opacity:1;
        }
        100%{
            opacity:0;
        }
    }

    @keyframes PageTransitionEnterContent
    {
        0%{
            transform:scale(1.01);
        }
        100%{
            opacity:1;
            transform:scale(1);
        }
    }
    @keyframes PageTransitionExitContent
    {
        0%{
            transform:scale(1);
        }
        100%{
            transform:scale(0.99);
        }
    }
`

export interface AnimatedPageTransitionProps extends PageTransitionOptions
{
    routeInfo:RouteInfo;
    children:any;
}

/**
 * @acIgnore
 */
export function AnimatedPageTransition({
    routeInfo,
    children,
    keyframes=defaultAnimatedPageTransitionKeyframes,
    transSpeed=600,
    enterName='PageTransitionEnter',
    exitName='PageTransitionExit',
    enterContentName='PageTransitionEnterContent',
    exitContentName='PageTransitionExitContent',
}:AnimatedPageTransitionProps){

    useInsertionEffect(()=>{
        const style=atDotCss({name:'AnimatedPageTransition',order:'frameworkHigh',css:`

            .AnimatedPageTransition, .PageTransition, .PageTransition-container, .PageTransition-item{
                width:100%;
                height:100%;
                margin:0;
                padding:0;
                overflow:hidden;
                overflow:clip;
                position:relative;
            }

            .AnimatedPageTransition.noClip,
            .AnimatedPageTransition.noClip .PageTransition,
            .AnimatedPageTransition.noClip .PageTransition-container,
            .AnimatedPageTransition.noClip .PageTransition-item {
                overflow:visible;
            }

            ${keyframes}

            .AnimatedPageTransition .PageTransition-item{
                display:flex;
                flex-direction:column;
                position:absolute;
                left:0;
                top:0;
            }
            .AnimatedPageTransition .PageTransition-item.enter{
                animation:${enterName} ${transSpeed}ms forwards;
                z-index:1;
            }
            .AnimatedPageTransition .PageTransition-item.exit{
                pointer-events:none;
                animation:${exitName} ${transSpeed}ms forwards;
                z-index:2;
            }
            .AnimatedPageTransition .PageTransition-item .Page-content{
                transform-origin:50% 0;
            }
            .AnimatedPageTransition .PageTransition-item.enter .Page-content{
                animation:${enterContentName} ${transSpeed}ms forwards;
            }
            .AnimatedPageTransition .PageTransition-item.exit .Page-content{
                pointer-events:none;
                animation:${exitContentName} ${transSpeed}ms forwards;
            }
        `});

        style.root();
    },[
        keyframes,
        transSpeed,
        enterName,
        exitName,
        enterContentName,
        exitContentName,
    ]);

    const disableClip=useSubject(disablePageClipSubject);

    return (
        <div className={cn("AnimatedPageTransition",disableClip && "noClip")}>

            <PageTransition duration={transSpeed+200} routeInfo={routeInfo}>
                {children}
            </PageTransition>
        </div>
    )

}

