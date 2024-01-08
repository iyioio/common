import { atDotCss } from "@iyio/at-dot-css";
import { ConversationUiCtrl, ConvoMessageComponent, FlatConvoMessage, parseConvoMessageComponents } from "@iyio/convo-lang";
import { JsonView } from "@iyio/react-common";
import { useMemo } from "react";

export interface MessageComponentRendererProps
{
    id:string;
    ctrl:ConversationUiCtrl;
    message:FlatConvoMessage;
    isUser?:boolean;
    index?:number;
    showSystemMessages?:boolean;
    showFunctions?:boolean;
    className?:string;
}

export function MessageComponentRenderer({
    message,
    className
}:MessageComponentRendererProps){

    const components=useMemo<ConvoMessageComponent[]|undefined>(()=>{
        return message.content?parseConvoMessageComponents(message.content):undefined;
    },[message.content]);

    return (
        <div className={style.root(null,className)}>

            {components?.map((c,i)=>(
                <JsonView key={i} value={c}/>
            ))}

        </div>
    )

}

const style=atDotCss({name:'MessageComponentRenderer',css:`
    @.root{
        display:flex;
        flex-direction:column;
    }
`});
