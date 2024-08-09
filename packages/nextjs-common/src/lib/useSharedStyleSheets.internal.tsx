import { sharedStyleSheets, sharedStyleSheetsUpdateSubject } from "@iyio/common";
import { useEffect, useState } from "react";


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

export const useWorkaroundForNextJsOutOfOrderStyleSheets=():boolean=>{

    const [refresh,setRefresh]=useState(false);
    useEffect(()=>{
        if(refresh){
            setRefresh(false);
        }
    },[refresh]);

    useEffect(()=>{
        let iv:any=null;
        let m=true;
        const sub=sharedStyleSheetsUpdateSubject.subscribe(()=>{
            if(!sharedStyleSheets.length){
                return;
            }
            clearInterval(iv);
            iv=setInterval(()=>{
                if(!m){
                    return;
                }
                let prev=sharedStyleSheets[0];
                if(!prev){
                    return;
                }
                let prevElem=globalThis.document?.getElementById(prev.id);
                if(!prevElem){
                    return;
                }

                for(let i=1;i<sharedStyleSheets.length;i++){
                    const sheet=sharedStyleSheets[i];
                    if(!sheet){
                        return;
                    }
                    const sheetElem=globalThis.document?.getElementById(sheet.id);
                    if(!sheetElem){
                        return;
                    }

                    if(sheetElem.previousElementSibling!==prevElem){
                        clearInterval(iv);
                        setRefresh(true);
                        return;
                    }
                }

                clearInterval(iv);
                sub.unsubscribe();

            },10);
        })
        return ()=>{
            m=false;
            sub.unsubscribe();
            clearInterval(iv);
        }
    },[]);

    return refresh;
}
