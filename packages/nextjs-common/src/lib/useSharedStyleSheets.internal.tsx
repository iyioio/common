import { sharedStyleSheets, sharedStyleSheetsUpdateSubject } from "@iyio/common";
import { useEffect, useState } from "react";


const getSheets=(updateKey?:number)=>{
    const ary:any[]=[];
    for(let i=0;i<sharedStyleSheets.length;i++){
        const s=sharedStyleSheets[i];
        if(!s){
            continue;
        }
        ary.push(<style data-sheet-order={i} type="text/css" key={updateKey===undefined?s.id:`sk${updateKey}-${s.id}`} id={s.id} dangerouslySetInnerHTML={{__html:s.css}}/>)
    }
    return ary;
}

export const useNextJsStyleSheets=(updateKey?:number)=>{

    const [sheets,setSheets]=useState<any[]>(getSheets);

    useEffect(()=>{
        let iv:any=null;
        let m=true;
        const sub=sharedStyleSheetsUpdateSubject.subscribe(()=>{
            clearInterval(iv);
            iv=setTimeout(()=>{
                if(m){
                    setSheets(getSheets(updateKey));
                }
            },0);
        })
        return ()=>{
            m=false;
            sub.unsubscribe();
        }
    },[updateKey]);

    return sheets;

}

export const useWorkaroundForNextJsOutOfOrderStyleSheets=():number=>{

    const [refresh,setRefresh]=useState(0);

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
                        setRefresh(v=>v+1);
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
