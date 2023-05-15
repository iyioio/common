import { deepCompare } from '@iyio/common';
import { useEffect, useRef, useState } from 'react';

export interface UseInvokeOptions<TOutput>
{
    refreshIndex?:number;
    disabled?:boolean;
    defaultValue?:TOutput;
}

export const useInvoke=<TInput,TOutput>(
    invoke:((input:TInput)=>Promise<TOutput>)|null|undefined,
    input:TInput|null|undefined,
    options:number|boolean|UseInvokeOptions<TOutput>=0
):TOutput|undefined=>{

    if(typeof options === 'number'){
        options={
            refreshIndex:options
        }
    }else if(typeof options === 'boolean'){
        options={
            disabled:options
        }
    }

    const {
        refreshIndex=0,
        disabled=false,
        defaultValue=undefined
    }=options;

    const lastInputRef=useRef<any>(undefined);

    const [tInput,setTInput]=useState<TInput|undefined|null>(undefined);

    const [output,setOutput]=useState<TOutput|undefined>(defaultValue);

    useEffect(()=>{

        if(lastInputRef.current===undefined){
            lastInputRef.current=input;
            setTInput(input);
            return;
        }

        if(deepCompare(lastInputRef.current,input)){
           return;
        }

        lastInputRef.current=input;
        setTInput(input);

    },[input]);

    useEffect(()=>{

        if(!tInput || !invoke || disabled){
            return;
        }

        let m=true;

        (async ()=>{
            try{
                const result=await invoke(tInput);
                if(!m){return;}
                setOutput(result);
            }catch(ex){
                console.error('useInvoke failed',ex);
                setOutput(undefined);
            }
        })()

        return ()=>{
            m=false;
        }

    },[tInput,invoke,refreshIndex,disabled]);

    return output;

}
