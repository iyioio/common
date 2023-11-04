import { atDotCss } from '@iyio/at-dot-css';
import { baseLayoutCn, BaseLayoutOuterProps, cn, strLineCount } from '@iyio/common';
import { parseConvoCode } from '@iyio/convo';
import { KeyboardEvent, useCallback, useEffect, useState } from "react";
import { dt } from '../lib/lib-design-tokens';
import { LineNumbers } from './LineNumbers';
import { useShiki } from './shiki';

export const defaultCodeLineStartReg=/^(\s*)/;
export const markdownCodeLineStartReg=/^(\s*-?\s*)/;

interface CodeInputProps extends BaseLayoutOuterProps
{
    tab?:string;
    language?:string;
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
    lineNumbers?:boolean;
    lineErrors?:number[]|number;
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
    lineNumbers,
    lineErrors,
    ...props
}:CodeInputProps){

    style.root();

    const sh=useShiki(language);

    const [parsingLineErrors,setParsingLineErrors]=useState<number[]|number|undefined>(undefined);

    const [code,setCode]=useState<HTMLElement|null>(null);
    const [textArea,setTextArea]=useState<HTMLTextAreaElement|null>(null);

    useEffect(()=>{

        if(!code || !sh || !textArea){
            setParsingLineErrors(undefined);
            return;
        }

        const r=parseConvoCode(value);
        (window as any).___code=value;
        console.log('hio 👋 👋 👋 parsing result',r.error,r);
        console.log(r.error?.near)

        setParsingLineErrors(r.error?.lineNumber);

        code.innerHTML=sh.codeToHtml(value,{lang:language});
        let minWidth=0;
        const codeElem=code.querySelector('code');
        if(codeElem){
            for(let i=0;i<codeElem.children.length;i++){
                const item=codeElem.children.item(i);
                if(!item){
                    continue;
                }
                const w=(item as HTMLElement).offsetWidth;
                if(w && w>minWidth){
                    minWidth=w;
                }
            }
        }
        textArea.style.minWidth=minWidth+'px';
    },[code,textArea,valueOverride,value,language,sh]);

    useEffect(()=>{
        onElem?.(code);
    },[onElem,code])


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
        <div className={cn("CodeInput",{tall,disabled,readOnly,lineNumbers:lineNumbers!==undefined},baseLayoutCn(props))}>

            {lineNumbers && <LineNumbers count={strLineCount(value)} lineErrors={lineErrors??parsingLineErrors} />}

            <div className="CodeInput-content">
                <div>
                    <div
                        key={language}
                        ref={setCode}
                        className={cn("no-select",language==='auto'?undefined:`language-${language}`)}
                    />

                    <textarea
                        spellCheck={false}
                        ref={setTextArea}
                        onKeyDown={onKeyDown}
                        onChange={e=>onChange?.(e.target.value)}
                        onBlur={e=>onBlur?.(e.target.value)}
                        value={value}
                        readOnly={readOnly}
                    />
                </div>
            </div>
        </div>
    )

}


const style=atDotCss({name:'CodeInput',css:`
    .CodeInput{
        display:flex;
        border-radius:8px;
        transition:opacity 0.1s ease-in-out;
        background:#1E1E1E;
    }
    .CodeInput textarea{
        all:unset;
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
    }
    .CodeInput pre,.CodeInput code{
        background: none !important;
    }
    .CodeInput textarea{
        position:absolute;
        left:0;
        top:0;
        width:100%;
        height:100%;
        overflow:hidden;
        overflow:clip;
        border:none;
        background:none;
        resize:none;
        color:transparent;
        caret-color: #ffffffcc;
        outline:none;
        outline-width:0;
        cursor:text;
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
    .CodeInput-content{
        display:flex;
        flex-direction:column;
        overflow-x:auto;
        flex:1;
    }
    .CodeInput-content > div{
        position:relative;
    }
    .CodeInput.lineNumbers .CodeInput-content > div{
        margin-left:0.5rem !important;
    }

`});
