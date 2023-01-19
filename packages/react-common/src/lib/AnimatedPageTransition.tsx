import { css, RouteInfo } from "@iyio/common";
import Style from "styled-jsx/style";
import { PageTransition } from "./PageTransition";

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

interface AnimatedPageTransitionProps
{
    routeInfo:RouteInfo;
    children:any;
    keyframes?:string;
    transSpeed?:number;
    enterName?:string;
    exitName?:string;
    enterContentName?:string;
    exitContentName?:string;
}

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

    return (
        <div className="AnimatedPageTransition">

            <PageTransition duration={transSpeed+200} routeInfo={routeInfo}>
                {children}
            </PageTransition>

            <Style id="iyio-AnimatedPageTransition-P8RnQXyu10LJ8sGlR2PD" global jsx>{css`

                .AnimatedPageTransition, .PageTransition, .PageTransition-container, .PageTransition-item{
                    width:100vw;
                    height:100vh;
                    margin:0;
                    padding:0;
                    overflow:hidden;
                    position:relative;
                }

                ${keyframes}

                .AnimatedPageTransition .PageTransition-item{
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

            `}</Style>
        </div>
    )

}
