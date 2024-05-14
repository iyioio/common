import { ReadonlySubject } from "@iyio/common";
import { useEffect, useState } from 'react';
import { BehaviorSubject, Observable } from "rxjs";

export function useSubject(subject:undefined):undefined;
export function useSubject<T>(subject:ReadonlySubject<T>):T
export function useSubject(subject:undefined):undefined;
export function useSubject<T>(subject:ReadonlySubject<T>|undefined):T|undefined;
export function useSubject<T>(subject:Observable<T>):T|undefined;
export function useSubject<T>(subject:ReadonlySubject<T>|Observable<T>|undefined):T|undefined
{
    const [value,setValue]=useState<T|undefined>(()=>(subject as any)?.value);

    useEffect(()=>{
        if(!subject){
            setValue(undefined);
            return;
        }
        const val=(subject as any).value;
        if(val!==undefined){
            setValue(val);
        }
        const sub=subject?.subscribe(v=>{
            setValue(v);
        })
        return ()=>{
            sub?.unsubscribe();
        }
    },[subject]);

    return value;
}
export function useFunctionSubject(subject:undefined):undefined;
export function useFunctionSubject<T>(subject:ReadonlySubject<T>):T
export function useFunctionSubject(subject:undefined):undefined;
export function useFunctionSubject<T>(subject:ReadonlySubject<T>|undefined):T|undefined;
export function useFunctionSubject<T>(subject:Observable<T>):T|undefined;
export function useFunctionSubject<T>(subject:ReadonlySubject<T>|Observable<T>|undefined):T|undefined
{
    const [value,setValue]=useState<T|undefined>(()=>(subject as any)?.value);

    useEffect(()=>{
        if(!subject){
            setValue(undefined);
            return;
        }
        const val=(subject as any).value;
        if(val!==undefined){
            if(typeof val === 'function'){
                setValue(()=>val);
            }else{
                setValue(val);
            }
        }
        const sub=subject?.subscribe(v=>{
            if(typeof v === 'function'){
                setValue(()=>v);
            }else{
                setValue(v);
            }
        })
        return ()=>{
            sub?.unsubscribe();
        }
    },[subject]);

    return value;
}

export const useIncrementSubject=(subject:BehaviorSubject<number>,active=true)=>{
    useEffect(()=>{
        if(!active){
            return;
        }
        subject.next(subject.value+1);
        return ()=>{
            subject.next(subject.value-1);
        }
    },[subject,active]);
}

export function useRenderSubject(subject:Observable<any>|null|undefined):number
{
    const [value,setValue]=useState(0);

    useEffect(()=>{
        if(!subject){
            return;
        }
        const sub=subject.subscribe(()=>{
            setValue(v=>v+1);
        })
        return ()=>{
            sub.unsubscribe();
        }
    },[subject]);

    return value;
}
