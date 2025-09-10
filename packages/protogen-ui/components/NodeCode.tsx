import { useSubject } from "@iyio/react-common";
import { useEffect, useState } from "react";
import { NodeCtrl } from "../lib/NodeCtrl.js";
import { CodeInput } from "./CodeInput.js";

interface NodeCodeProps
{
    node:NodeCtrl;
}

export function NodeCode({
    node
}:NodeCodeProps){

    const [codeElem,setCodeElem]=useState<HTMLElement|null>(null);

    const code=useSubject(node.code);

    const viewOnlyCode=useSubject(node.viewOnlyCodeSubject);
    const completing=useSubject(node.completingSubject);

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
            textarea.setSelectionRange(textarea.value.length,textarea.value.length);
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
            value={viewOnlyCode??code}
            tab={'  '}
            readOnly={!!viewOnlyCode || completing}
            valueOverride={viewOnlyCode??undefined}
            onChange={node.setCodeBound}
            onSubmit={node.updateBound}
            onBlur={node.updateBound}
            onTextarea={setTextarea}
            onElem={setCodeElem}/>
    )

}
