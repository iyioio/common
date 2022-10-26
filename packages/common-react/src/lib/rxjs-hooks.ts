import { ReadonlySubject } from "@iyio/rxjs";
import { useEffect, useState } from 'react';

export function useSubject(subject:undefined):undefined;
export function useSubject<T>(subject:ReadonlySubject<T>):T
export function useSubject(subject:undefined):undefined;
export function useSubject<T>(subject:ReadonlySubject<T>|undefined):T|undefined;
export function useSubject<T>(subject:ReadonlySubject<T>|undefined):T|undefined
{
    const [value,setValue]=useState<T|undefined>(subject?.value);

    useEffect(()=>{
        if(!subject){
            setValue(undefined);
            return;
        }
        setValue(subject.value);
        const sub=subject?.subscribe(v=>{
            setValue(v);
        })
        return ()=>{
            sub?.unsubscribe();
        }
    },[subject]);

    return value;
}
