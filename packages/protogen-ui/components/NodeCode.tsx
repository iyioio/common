import { getSubstringCount } from "@iyio/common";
import { useCallback, useEffect, useRef, useState } from "react";
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

    const [code,setCode]=useState(node.code.value);
    const codeRef=useRef(code);
    codeRef.current=code;

    useEffect(()=>{
        const sub=node.code.subscribe(v=>{
            setCode(v);
        })
        return ()=>{
            sub.unsubscribe();
        }
    },[node])

    const update=useCallback(()=>{
        node.code.next(codeRef.current);
        node.update();
    },[node])

    useEffect(()=>{
        node.codeElem.next(codeElem);
        node.update();
    },[node,codeElem]);

    const lastLineCount=useRef(-1);
    useEffect(()=>{
        if(!codeElem){
            return;
        }
        const count=getSubstringCount(code,'\n');
        if(count!==lastLineCount.current){
            lastLineCount.current=count;
            node.code.next(code);
            node.update();
        }
    },[code,node,codeElem]);

    const [textarea,setTextarea]=useState<HTMLTextAreaElement|null>(null);
    useEffect(()=>{
        if(node.autoFocus && textarea){
            node.autoFocus=false;
            const i=textarea.value.indexOf('*hidden*');
            if(i===-1){
                textarea.setSelectionRange(textarea.value.length,textarea.value.length);
            }else{
                textarea.setSelectionRange(i-1,i-1);
            }
            textarea.focus();
        }
    },[textarea,node])

    return (
        <CodeInput
            language="markdown"
            value={code}
            onChange={setCode}
            onSubmit={update}
            onBlur={update}
            onTextarea={setTextarea}
            onElem={setCodeElem}/>
    )

}
