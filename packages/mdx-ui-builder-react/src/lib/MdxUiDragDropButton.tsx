import { atDotCss } from "@iyio/at-dot-css";
import { BaseLayoutProps } from "@iyio/common";
import { MdxUiDragDropSource, mdxUiDragDropIdAtt } from "@iyio/mdx-ui-builder";
import { useId, useMemo, useRef } from "react";
import { useOptionalMdxUiBuilder } from "./mdx-ui-builder-react-lib.js";

export interface MdxUiDragDropButtonProps
{
    children?:any;

    source:MdxUiDragDropSource;
}

export function MdxUiDragDropButton({
    children,
    source,
    ...props
}:MdxUiDragDropButtonProps & BaseLayoutProps){

    const builder=useOptionalMdxUiBuilder();

    const dropId=useId();

    const refs=useRef({source});
    refs.current.source=source;
    const src=useMemo<MdxUiDragDropSource>(()=>{
        return {
            getSourceCode:(target)=>{
                return refs.current.source.getSourceCode?.(target)??refs.current.source.sourceCode;
            }
        }
    },[])

    return (
        <button
            {...{[mdxUiDragDropIdAtt]:dropId}}
            className={style.root(null,null,props)}
            draggable
            onDragStart={()=>{if(builder)builder.dragDropSource=src}}
            onDragEnd={()=>{
                setTimeout(()=>{
                    if(builder?.dragDropSource===src){
                        builder.dragDropSource=null;
                    }
                },50);
            }}
        >

            {children}

        </button>
    )

}

const style=atDotCss({name:'MdxUiDragDropButton',css:`
    @.root{
        display:flex;
        flex-direction:column;
    }
`});
