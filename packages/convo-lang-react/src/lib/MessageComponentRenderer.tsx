import { objectToMarkdown } from "@iyio/common";
import { ConvoComponentRendererContext, ConvoMessageComponent, parseConvoMessageComponents } from "@iyio/convo-lang";
import { Fragment, useMemo } from "react";

export interface MessageComponentRendererProps
{
    ctx:ConvoComponentRendererContext;
}

export function MessageComponentRenderer({
    ctx,
}:MessageComponentRendererProps){

    const content=ctx.message.content;
    const id=ctx.id;

    const components=useMemo<ConvoMessageComponent[]|undefined>(()=>{
        return content?parseConvoMessageComponents(content):undefined;
    },[content]);


    return (
        <>
            {components?.map((c,i)=>{
                const renderer=ctx.ctrl.componentRenderers[c.name];

                if(renderer){
                    return (
                        <Fragment key={id+'-c-'+i}>
                            {renderer(c,ctx)}
                        </Fragment>
                    )
                }else{
                    return (
                        <div key={id+'-m-'+i} className={ctx.className}>
                            {objectToMarkdown(c)}
                        </div>
                    )
                }

            })}
        </>

    )

}

