import { objectToMarkdown } from "@iyio/common";
import { ConvoComponentRenderFunction, ConvoComponentRendererContext, ConvoComponentRendererWithOptions, ConvoMessageComponent, parseConvoMessageComponents } from "@iyio/convo-lang";
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
                let fn:ConvoComponentRenderFunction|undefined;
                let options:ConvoComponentRendererWithOptions|undefined;
                if(typeof renderer === 'function'){
                    options=undefined;
                    fn=renderer;
                }else{
                    options=renderer;
                    fn=options?.render;
                }

                if(fn){
                    return (
                        <Fragment key={id+'-c-'+i}>
                            {options?.doNotRenderInRow?
                                fn(c,ctx)
                            :
                                <div className={ctx.rowClassName}>
                                    {fn(c,ctx)}
                                </div>
                            }
                        </Fragment>
                    )
                }else{
                    return (
                        <div className={ctx.rowClassName} key={id+'-m-'+i}>
                            <div className={ctx.className}>
                                {objectToMarkdown(c)}
                            </div>
                        </div>
                    )
                }

            })}
        </>

    )

}

