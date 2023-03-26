import hljs from 'highlight.js';
import { useMemo } from "react";
import { CodeLanguage } from './code-lib';
import "./code-style";

interface CodeViewProps
{
    language?:CodeLanguage;
    value?:string;
    wrap?:boolean;
    children?:string;
}

export function CodeView({
    language='auto',
    value,
    wrap,
    children
}:CodeViewProps){

    const code=value||children||'';

    const html=useMemo(
        ()=>code?{
            __html:(language==='auto'?hljs.highlightAuto(code):hljs.highlight(language,code)).value
            }:undefined,
        [code,language]
    )

    return (
        <>
            <pre className="CodeView"><code dangerouslySetInnerHTML={html}/></pre>
            <style global jsx>{`
                .CodeView.pre, .CodeView > code{
                    margin:0 !important;
                    padding:0 !important;
                    display:block !important;
                    overflow-x:hidden !important;
                    overflow-y:hidden !important;
                    white-space:${wrap?'pre-wrap':'pre'} !important;
                    font-family:Courier !important;
                    font-size:14px !important;
                }
            `}</style>
        </>
    )

}
