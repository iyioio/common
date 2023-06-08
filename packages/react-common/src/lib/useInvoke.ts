import { FnError, deepCompare, isFnError } from '@iyio/common';
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
    const {result}=useInvokeEx(invoke,input,options);
    return result;
}

export interface UseInvokeExResult<TOutput>
{
    result?:TOutput;
    error?:any;
    fnError?:FnError;
    errorMessage?:string;
    unauthorized?:boolean;
    noFound?:boolean;
}
export const useInvokeEx=<TInput,TOutput>(
    invoke:((input:TInput)=>Promise<TOutput>)|null|undefined,
    input:TInput|null|undefined,
    options:number|boolean|UseInvokeOptions<TOutput>=0
):UseInvokeExResult<TOutput>=>{

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

    const [error,setError]=useState<any>(undefined);
    const fnError=isFnError(error)?error:undefined;

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

        if(tInput===undefined || !invoke || disabled){
            return;
        }

        let m=true;

        (async ()=>{
            try{
                setError(undefined);
                const result=await invoke((tInput===null?undefined:tInput) as any);
                if(!m){return;}
                setOutput(result);
            }catch(ex){
                console.error('useInvoke failed',ex);
                if(m){
                    setOutput(undefined);
                    setError(ex);
                }
            }
        })()

        return ()=>{
            m=false;
        }

    },[tInput,invoke,refreshIndex,disabled]);

    const result:UseInvokeExResult<TOutput>={
        result:output,
    }
    if(error){
        result.error=error;
        const msg=(error as any)?.message;
        if(typeof msg === 'string'){
            result.errorMessage=msg;
        }
    }

    if(fnError){
        result.fnError=fnError;
        result.errorMessage=fnError.errorMessage;
        switch(fnError.errorCode){
            case 404:
                result.noFound=true;
                break;
            case 401:
                result.unauthorized=true;
                break;
        }
    }

    return result;

}
