import { markdownHidden } from "@iyio/protogen";
import { useSubject } from "@iyio/react-common";
import { useEffect, useState } from "react";
import { NodeCtrl } from "../lib/NodeCtrl";
import { CodeInput } from "./CodeInput";

interface NodeCodeProps
{
    node:NodeCtrl;
}

export function NodeCode({
    node
}:NodeCodeProps){

    const [codeElem,setCodeElem]=useState<HTMLElement|null>(null);

    const code=useSubject(node.code);

    useEffect(()=>{
        node.codeElem.next(codeElem);
    },[node,codeElem]);

    const [textarea,setTextarea]=useState<HTMLTextAreaElement|null>(null);
    useEffect(()=>{
        if(!textarea){
            return;
        }
        if(node.autoFocus){
            node.autoFocus=false;
            const i=textarea.value.indexOf(markdownHidden);
            if(i===-1){
                textarea.setSelectionRange(textarea.value.length,textarea.value.length);
            }else{
                textarea.setSelectionRange(i-1,i-1);
            }
            textarea.focus();
        }

        if(node.autoFocusType){
            node.autoFocus=false;
            const match=/((^|\n)##\s)([$\w]+)/.exec(textarea.value);
            if(!match){
                textarea.setSelectionRange(textarea.value.length,textarea.value.length);
            }else{
                const start=(match.index??0)+match[1].length;
                textarea.setSelectionRange(start,start+match[3].length);
            }
            textarea.focus();
        }
    },[textarea,node])

    return (
        <CodeInput
            language="p-markdown"
            value={code}
            tab={'  '}
            onChange={node.setCodeBound}
            onSubmit={node.updateBound}
            onBlur={node.updateBound}
            onTextarea={setTextarea}
            onElem={setCodeElem}/>
    )

}
