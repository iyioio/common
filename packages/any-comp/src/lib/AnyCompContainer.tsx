import { atDotCss } from "@iyio/at-dot-css";
import { ErrorBoundary } from "@iyio/react-common";
import { useState } from "react";
import { AnyComp } from "./AnyComp";
import { AcComp } from "./any-comp-types";


export interface AnyCompContainerProps
{
    comp?:AcComp;
    placeholder?:any;
}

export function AnyCompContainer({
    comp,
    placeholder,
}:AnyCompContainerProps){

    const [props,setProps]=useState<Record<string,any>>({});

    return (
        <div className={style.root()}>

            <div className={style.container()}>
                <ErrorBoundary key={comp?.id}>
                    <AnyComp comp={comp} compProps={props} placeholder={placeholder} />
                </ErrorBoundary>
            </div>

        </div>
    )

}

const style=atDotCss({name:'AnyCompContainer',css:`
    @.root{
        display:flex;
        flex-direction:column;
        gap:1rem;
    }
    @.container{
        display:flex;
        flex-direction:column;
        position:relative;
        flex:1;
    }
`});
