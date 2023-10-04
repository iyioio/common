import { AtDotStyle } from "@iyio/common";
import { useEffect, useState } from "react";
import { BehaviorSubject } from "rxjs";

export const sharedStyleSheets:AtDotStyle<string>[]=[];

export const sharedStyleSheetsUpdateSubject=new BehaviorSubject<number>(0);

const getSheets=()=>{
    const ary:any[]=[];
    for(let i=0;i<sharedStyleSheets.length;i++){
        const s=sharedStyleSheets[i];
        if(!s){
            continue;
        }
        ary.push(<style type="text/css" key={s.id} id={s.id} dangerouslySetInnerHTML={{__html:s.css}}/>)
    }
    return ary;
}

export const useNextJsStyleSheets=()=>{

    const [sheets,setSheets]=useState<any[]>(getSheets);

    useEffect(()=>{
        let iv:any=null;
        let m=true;
        const sub=sharedStyleSheetsUpdateSubject.subscribe(()=>{
            clearInterval(iv);
            iv=setTimeout(()=>{
                if(m){
                    setSheets(getSheets());
                }
            },0);
        })
        return ()=>{
            m=false;
            sub.unsubscribe();
        }
    },[]);

    return sheets;

}
