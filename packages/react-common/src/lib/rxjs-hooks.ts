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

export const useIncrementSubject=(subject:BehaviorSubject<number>,active:boolean=true)=>{
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
