import { atDotCss } from "@iyio/at-dot-css";
import { BehaviorSubject } from "rxjs";
import { useFunctionSubject } from "./rxjs-hooks";

export const loadingIndicatorRendererSubject=new BehaviorSubject<((props:LoadingIndicatorProps)=>any)|null>(null);

export interface LoadingIndicatorProps
{
    color?:string;
    size?:number;
    className?:string;
}

export function LoadingIndicator(props:LoadingIndicatorProps){

    const renderer=useFunctionSubject(loadingIndicatorRendererSubject);

    if(renderer){
        return renderer(props);
    }

    const {
        color,
        size=100,
        className,
    }=props;

    style.root();

    return (
        <>
            <svg width={size} height={size} viewBox="0 0 500 500" fill="none" className={"LoadingIndicator"+(className?' '+className:'')}>
                <path fillRule="evenodd" clipRule="evenodd" d="M250 500C388.071 500 500 388.071 500 250C500 111.929 388.071 0 250 0C111.929 0 0 111.929 0 250C0 388.071 111.929 500 250 500ZM232.176 476.548C357.295 476.548 458.724 375.119 458.724 250C458.724 124.881 357.295 23.4522 232.176 23.4522C107.057 23.4522 5.62852 124.881 5.62852 250C5.62852 375.119 107.057 476.548 232.176 476.548Z" fill={color}>
                    <animateTransform
                        attributeName="transform"
                        type="rotate"
                        from="0 250 250"
                        to="360 250 250"
                        dur="5s"
                        repeatCount="indefinite"/>
                </path>
            </svg>
        </>
    )

}

const style=atDotCss({name:'LoadingIndicator',order:'frameworkHigh',css:`
    .LoadingIndicator path{
        fill:#ffffff;
    }
`});
