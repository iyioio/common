import { atDotCss } from '@iyio/at-dot-css';
import { BaseLayoutOuterProps, cn, CodeParser, CodeParsingError, CodeParsingResult, escapeHtml, getSubstringCount, strLineCount } from '@iyio/common';
import { scrollViewContainerMinHeightCssVar } from '@iyio/react-common';
import { KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import { dt } from '../lib/lib-design-tokens.js';
import { LineNumbers } from './LineNumbers.js';
import { loadMdCodeBlocks, supportsMdCodeBlocks, useShiki } from './shiki.js';

export const defaultCodeLineStartReg=/^(\s*)/;
export const markdownCodeLineStartReg=/^(\s*-?\s*)/;


interface CodeInputProps<P=any> extends BaseLayoutOuterProps
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
    errors?:(CodeParsingError|number)[];
    fillScrollHeight?:boolean;

    parser?:CodeParser<P>;
    parserOptions?:any;
    parsingDelayMs?:number;
    onParsed?:(result:CodeParsingResult)=>void;
    logParsed?:boolean;
    debugParser?:boolean|((...args:any[])=>void);
    bottomPadding?:number|string;

    highlightPrefix?:string;
    highlightSuffix?:string;
}

/**
 * @acIgnore
 */
export function CodeInput<P=any>({
    tab='    ',
    language:_language='auto',
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
    errors,
    parser,
    parserOptions,
    onParsed,
    logParsed,
    parsingDelayMs=700,
    debugParser,
    bottomPadding=500,
    fillScrollHeight,
    highlightPrefix,
    highlightSuffix,
    ...props
}:CodeInputProps<P>){

    const [language,setLanguage]=useState(_language);
    useEffect(()=>{
        setLanguage(_language);
    },[_language]);
    useEffect(()=>{
        if(_language==='text' && jsonStart.test(value) && jsonEnd.test(value)){
            setLanguage('json');
        }
    },[value,_language]);

    const {sh,loadIndex}=useShiki(language);

    const [parsingErrors,setParsingErrors]=useState<(CodeParsingError|number)[]|undefined>(undefined);

    const [code,setCode]=useState<HTMLElement|null>(null);
    const [textArea,setTextArea]=useState<HTMLTextAreaElement|null>(null);

    const refs=useRef({onParsed});
    refs.current.onParsed=onParsed;

    useEffect(()=>{

        setParsingErrors(undefined);

        if(!code || !textArea || !sh){
            return;
        }

        const fullValue=(highlightPrefix??'')+value+(highlightSuffix??'');
        let lineOptions:LineOption[]=[];
        if(highlightPrefix){
            const n=getSubstringCount(highlightPrefix,'\n');
            for(let i=1;i<=n;i++){
                lineOptions.push({
                    line:i,
                    classes:['hide-prefix']
                })
            }
        }
        if(highlightSuffix){
            const n=getSubstringCount(highlightSuffix,'\n');
            const lineCount=getSubstringCount(fullValue,'\n');
            for(let i=0;i<n;i++){
                lineOptions.push({
                    line:lineCount-i+1,
                    classes:['hide-suffix']
                })
            }
        }
        let iv:any=undefined;
        let highlighted:string;
        if(supportsMdCodeBlocks(language)){
            loadMdCodeBlocks(language,fullValue);
        }
        try{
            highlighted=sh.codeToHtml(fullValue,{
                lang:sh.getLoadedLanguages().includes(language)?language:'text',
                theme:'dark-plus',
                transformers:[{
                    line:function(elem,line){
                        for(const lo of lineOptions){
                            if(lo.line===line && lo.classes){
                                this.addClassToHast(elem,lo.classes)
                            }
                        }
                    }
                }]
            });
        }catch(ex){
            console.error('code to html failed',ex);
            return;
        }
        code.innerHTML=highlighted;
        const codeElem=code.querySelector('code');
        let minWidth=0;
        if(codeElem){
            minWidth=processLines(codeElem);
        }
        textArea.style.minWidth=minWidth+'px';

        if(parser){
            iv=setTimeout(()=>{
                try{
                    const r=parser(fullValue,{
                        debug:debugParser?debugParser===true?console.info:debugParser:undefined,
                        ...parserOptions
                    });
                    if(logParsed){
                        console.info('CodeInput parsing result',r)
                    }
                    refs.current.onParsed?.(r);

                    setParsingErrors(r.error?[r.error]:undefined);
                    if(r.error){
                        console.info('⛔️ CodeInput parsing error',r.error);
                        console.info(r.error.near);
                        code.innerHTML=sh.codeToHtml(fullValue,{lang:language,theme:'dark-plus',transformers:[{
                            line:function(elem,line){
                                if(line===r.error?.lineNumber){
                                    this.addClassToHast(elem,'CodeInput-errorLine')
                                }
                                for(const lo of lineOptions){
                                    if(lo.line===line && lo.classes){
                                        this.addClassToHast(elem,lo.classes)
                                    }
                                }
                            }
                        }]}).replace(
                            /class="[^"]*CodeInput-errorLine[^"]*"[^>]*>/g,
                            v=>`${v}<div class="CodeInput-error">${
                                escapeHtml(r.error?.message?.replace(/\n/g,'\\n').replace(/\r/g,'\\r')??'')
                            }</div><div class="CodeInput-errorCol">${
                                '&nbsp;'.repeat((r.error?.col??0)-1)+'_'
                            }</div>`
                        );
                        const codeElem=code.querySelector('code');
                        if(codeElem){
                            processLines(codeElem);
                        }
                    }
                }catch(ex){
                    setParsingErrors([0]);
                }
            },parsingDelayMs);

        }else{
            setParsingErrors(undefined);
            return undefined;
        }

        return ()=>{
            clearTimeout(iv);
        }
    },[
        code,textArea,valueOverride,value,language,parser,sh,loadIndex,
        parsingDelayMs,logParsed,debugParser,parserOptions,
        highlightPrefix,highlightSuffix
    ]);

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
        <>
            <div
                className={style.root({tall,disabled,readOnly,lineNumbers:lineNumbers!==undefined},null,props)}
                style={{
                    minHeight:fillScrollHeight?`var(${scrollViewContainerMinHeightCssVar})`:undefined
                }}
            >

                {lineNumbers && <LineNumbers count={strLineCount(value)} errors={errors??parsingErrors} />}

                <div className="CodeInput-content">
                    <div>
                        <div
                            key={language}
                            ref={setCode}
                            className={cn("no-select",language==='auto'?undefined:`language-${language}`)}
                            style={{marginBottom:bottomPadding}}
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
        </>
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
        padding: 0 !important;
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
        min-height:100%;
    }
    .CodeInput.lineNumbers .CodeInput-content > div{
        margin-left:0.5rem !important;
    }

    .CodeInput-errorLine{
        position:relative;
    }
    .CodeInput-errorLine > .CodeInput-error{
        position:absolute;
        left:calc( 100% + 1rem);
        font-size:12px !important;
        line-height:12px !important;
        display:flex;
        align-items:center;
        background-color:#ff000033;
        top:-0.2rem;
        bottom:-0.2rem;
        padding:0 0.4rem;
        border-radius:4px;
    }
    .CodeInput-errorCol{
        position:absolute;
        left:0;
        top:0;
        color:#ff000088;
    }
    .CodeInput .hide-prefix, .CodeInput .hide-suffix{
        display:none;
    }
`});

interface LineOption {
    /**
     * 1-based line number.
     */
    line: number;
    classes?: string[];
}

const processLines=(codeElem:HTMLElement)=>{
    let minWidth=0;
    for(let i=0;i<codeElem.children.length;i++){
        const item=codeElem.children.item(i);
        if(!item){
            continue;
        }
        if(item.classList.contains('hide-prefix')){
            const text=item.nextSibling;
            if(text instanceof Text){
                text.remove();
            }
            item.remove();
            continue;
        }
        if(item.classList.contains('hide-suffix')){
            const text=item.previousSibling;
            if(text instanceof Text){
                text.remove();
            }
            item.remove();
            continue;
        }
        const w=(item as HTMLElement).offsetWidth;
        if(w && w>minWidth){
            minWidth=w;
        }
    }
    return minWidth;
}

const jsonStart=/^\s*\{/;
const jsonEnd=/\}\s*$/;
