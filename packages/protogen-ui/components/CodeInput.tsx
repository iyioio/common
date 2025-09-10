import { baseLayoutCn, BaseLayoutOuterProps, cn, escapeHtml } from '@iyio/common';
import hljs from 'highlight.js';
import { KeyboardEvent, useCallback, useEffect, useState } from "react";
import { dt } from '../lib/lib-design-tokens.js';
import { registerGrammars } from '../lib/registerGrammars.js';
import { CodeLanguage } from './code-lib.js';
import "./code-style";

export const defaultCodeLineStartReg=/^(\s*)/;
export const markdownCodeLineStartReg=/^(\s*-?\s*)/;

interface CodeInputProps extends BaseLayoutOuterProps
{
    tab?:string;
    language?:CodeLanguage;
    readOnly?:boolean;
    valueOverride?:string;
    value:string;
    disabled?:boolean;
    onChange?:(value:string)=>void;
    /**
     * Called when Command enter or Ctrl enter is pressed
     */
    onSubmit?:(value:string)=>void;
    onBlur?:(value:string)=>void;
    onNewLine?:(value:string)=>void;
    tall?:boolean;
    onElem?:(elem:HTMLElement|null)=>void;
    onTextarea?:(elem:HTMLTextAreaElement|null)=>void;
    lineStartReg?:RegExp|null;
    lineStartRegIndex?:number;
}

export function CodeInput({
    tab='    ',
    language='auto',
    value,
    readOnly,
    valueOverride,
    disabled,
    onChange,
    onSubmit,
    onElem,
    onTextarea,
    onBlur,
    onNewLine,
    tall,
    lineStartReg=defaultCodeLineStartReg,
    lineStartRegIndex=1,
    ...props
}:CodeInputProps){

    useEffect(()=>{
        registerGrammars();
    },[]);

    const [code,setCode]=useState<HTMLElement|null>(null);
    useEffect(()=>{
        if(!code){
            return;
        }
        code.innerHTML=escapeHtml((valueOverride??value)||' ')+'&nbsp;';
        code.removeAttribute('data-highlighted');
        hljs.highlightElement(code);
    },[code,valueOverride,value,language]);

    useEffect(()=>{
        onElem?.(code);
    },[onElem,code])

    const [textArea,setTextArea]=useState<HTMLTextAreaElement|null>(null);

    useEffect(()=>{
        onTextarea?.(textArea);
    },[onTextarea,textArea])


    const onKeyDown=useCallback((e:KeyboardEvent)=>{
        if(disabled){
            e.preventDefault();
            return;
        }
        if(!textArea){
            return;
        }
        switch(e.key){

            case "Tab":{
                e.preventDefault();
                const value=(
                    textArea.value.substring(0,textArea.selectionStart)+
                    tab+
                    textArea.value.substring(textArea.selectionStart)
                );
                const s=textArea.selectionStart+tab.length
                textArea.value=value;
                textArea.selectionStart=s;
                textArea.selectionEnd=s;
                textArea.focus();
                onChange?.(value);
                break;
            }

            case "Enter":{
                const value=(
                    textArea.value.substring(0,textArea.selectionStart)+
                    textArea.value.substring(textArea.selectionStart)
                );
                if(e.metaKey || e.ctrlKey){
                    e.preventDefault();
                    const s=textArea.selectionStart;
                    textArea.value=value;
                    if(s>=0){
                        textArea.selectionStart=s;
                        textArea.selectionEnd=s;
                        textArea.focus();
                    }
                    onSubmit?.(value);
                }else{
                    const s=textArea.selectionStart;
                    if(lineStartReg && s>0 && s===textArea.selectionEnd){
                        const i=textArea.value.lastIndexOf('\n',s-1);
                        if(i!=-1){
                            const prevLine=textArea.value.substring(i+1,s);
                            const lineStart=lineStartReg.exec(prevLine)?.[lineStartRegIndex];
                            if(lineStart){
                                e.preventDefault();
                                textArea.value=textArea.value.substring(0,s)+'\n'+lineStart+textArea.value.substring(s);
                                textArea.selectionStart=s+lineStart.length+1;
                                textArea.selectionEnd=s+lineStart.length+1;
                                onChange?.(textArea.value);
                                textArea.focus();
                            }
                        }
                    }
                    onNewLine?.(value)
                }
                break;
            }
        }
    },[textArea,tab,onChange,onSubmit,onNewLine,disabled,lineStartReg,lineStartRegIndex])


    return (
        <div className={cn("CodeInput",{tall,disabled,readOnly},baseLayoutCn(props))}>

            <pre className="no-select">
                <code
                    key={language}
                    ref={setCode}
                    className={language==='auto'?undefined:`language-${language}`}/>
            </pre>

            <textarea
                ref={setTextArea}
                onKeyDown={onKeyDown}
                onChange={e=>onChange?.(e.target.value)}
                onBlur={e=>onBlur?.(e.target.value)}
                value={value}
                readOnly={readOnly}/>


            <style global jsx>{`
                .CodeInput{
                    display:flex;
                    flex-direction:column;
                    position:relative;
                    border-radius:8px;
                    transition:opacity 0.1s ease-in-out;
                }
                .CodeInput.tall{
                    min-height:200px;
                }
                .CodeInput.disabled{
                    opacity:0.4;
                }
                .CodeInput.disabled textarea{
                    opacity:0;
                }
                .CodeInput code, .CodeInput textarea{
                    margin:0 !important;
                    padding:0 !important;
                    display:block;
                    overflow-x:hidden !important;
                    overflow-y:hidden !important;
                    white-space:pre;
                    font-family:Courier !important;
                    font-size:${dt().codeFontSize}px !important;
                    line-height:${dt().codeLineHeight}px !important;
                    min-height:${dt().codeLineHeight}px;
                }
                .CodeInput code *{
                    font-size:${dt().codeFontSize}px !important;
                    line-height:${dt().codeLineHeight}px !important;
                }
                .CodeInput pre{
                    margin:0 !important;
                    padding:0 !important;
                    display:block;
                    overflow-x:hidden !important;
                    overflow-y:hidden !important;
                }
                .CodeInput pre,.CodeInput code{
                    background: none !important;
                }
                .CodeInput textarea{
                    position:absolute;
                    left:0;
                    top:0;
                    right:0;
                    bottom:0;
                    border:none;
                    background:none;
                    resize:none;
                    color:#00000000;
                    caret-color: #ffffffcc;
                    outline:none;
                    outline-width:0;
                }
                .CodeInput.readOnly textarea{
                    pointer-events:none;
                }
                .CodeInput .no-select{
                    pointer-events:none;
                }
                .CodeInput.readOnly .no-select{
                    pointer-events:auto;
                }
            `}</style>
        </div>
    )

}
