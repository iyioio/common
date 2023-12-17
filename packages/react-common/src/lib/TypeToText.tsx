import { useEffect, useRef, useState } from "react";
import { Text, TextProps } from "./Text";

export interface TypeToTextProps extends Omit<TextProps,'children'>
{
    typingIntervalMs?:number;
    skipTyping?:boolean;
    delayMs?:number;
    reset?:any;
    cursor?:string;
    cursorIntervalMs?:number;
    onDoneTyping?:(done:true)=>void;
    onDoneTypingNoArgs?:()=>void;
    doneDelayMs?:number;
    hold?:boolean;
    longChars?:string;
    longCharMultiplier?:number;
}

export function TypeToText({
    typingIntervalMs=30,
    skipTyping,
    reset=1,
    text='',
    delayMs=500,
    doneDelayMs=delayMs,
    cursor='',
    cursorIntervalMs=500,
    onDoneTyping,
    onDoneTypingNoArgs,
    hold,
    longCharMultiplier=4,
    longChars='.,',
    ...props
}:TypeToTextProps){

    const [elem,setElem]=useState<HTMLElement|null>(null);
    const [typing,setTyping]=useState(false);

    const refs=useRef({onDoneTyping,onDoneTypingNoArgs});
    refs.current.onDoneTyping=onDoneTyping;
    refs.current.onDoneTypingNoArgs=onDoneTypingNoArgs;

    useEffect(()=>{
        setTyping(false);
        if(!elem){
            return;
        }
        if(!text || hold){
            elem.innerHTML=hold?'&nbsp;':'';
            return;
        }
        if(skipTyping){
            elem.innerText=text;
            return;
        }

        elem.innerHTML='&nbsp;';
        let m=true;
        let i=0;
        const ary=[...text];
        let txt='';
        const long=[...longChars];
        let longI=0;

        let iv:any=null;

        const done=()=>{
            if(!m){
                return;
            }
            refs.current.onDoneTyping?.(true);
            refs.current.onDoneTypingNoArgs?.();
        }

        const startTyping=()=>{
            setTyping(true);
            iv=setInterval(()=>{
                if(!m){
                    return;
                }
                const char=ary[i];
                if(char && long.includes(char)){
                    if(longI===0){
                        txt+=char;
                        elem.innerText=txt+cursor;
                    }
                    if(longI<longCharMultiplier){
                        longI++;
                        return;
                    }
                    longI=0;
                }else{
                    txt+=char;
                    elem.innerText=txt+cursor;
                }
                i++;
                if(i>=ary.length){
                    elem.innerText=txt;
                    clearInterval(iv);
                    setTyping(false);
                    if(doneDelayMs>0){
                        setTimeout(done,doneDelayMs);
                    }else{
                        done();
                    }
                }
            },typingIntervalMs);
        }

        if(delayMs>0){
            setTimeout(()=>{
                if(m){
                    startTyping();
                }
            },delayMs);
        }else{
            startTyping();
        }

        return ()=>{
            m=false;
            clearInterval(iv);
        }
    },[
        elem,
        text,
        typingIntervalMs,
        skipTyping,
        reset,
        delayMs,
        cursor,
        doneDelayMs,
        hold,
        longCharMultiplier,
        longChars,
    ]);

    useEffect(()=>{
        if(!cursor || !elem || typing){
            return;
        }

        const span=document.createElement('span');
        span.innerText=cursor;
        span.style.opacity='1';
        elem.append(span);
        let visible=true;
        let m=true;
        const iv=setInterval(()=>{
            if(!m){
                return;
            }
            visible=!visible;
            span.style.opacity=visible?'1':'0';
        },cursorIntervalMs);

        return ()=>{
            clearInterval(iv);
            m=false;
            span.remove();
        }

    },[typing,elem,cursor,cursorIntervalMs]);

    return (
        <Text {...props} elemRef={setElem} />
    )

}
