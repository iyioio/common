import { SharedStyleSheet, getStyleSheetOrder, sharedStyleSheets, sharedStyleSheetsUpdateSubject } from "@iyio/common";
import { useEffect } from "react";

interface SheetRecord
{
    elem:HTMLStyleElement;
    sheet:SharedStyleSheet;
    inserted:boolean;
    order:number;
}
const sheets:SheetRecord[]=[];

const updateSheets=()=>{
    for(let i=0;i<sharedStyleSheets.length;i++){
        const s=sharedStyleSheets[i];
        if(!s){
            continue;
        }
        const current=sheets.find(st=>st.sheet.id===s.id)
        if(current){
            if(current.sheet.hash && s.hash && s.hash!==current.sheet.hash){
                current.elem.innerHTML=s.css;
            }
            continue;
        }
        const sheet={
            elem:document.createElement('style'),
            sheet:s,
            inserted:false,
            order:getStyleSheetOrder(s.order)
        };
        sheet.elem.id=s.id;
        sheet.elem.innerHTML=s.css;
        sheets.push(sheet);
    }
    sheets.sort((a,b)=>a.order-b.order);
    let prev:SheetRecord|undefined;
    for(let i=0;i<sheets.length;i++){
        const sheet=sheets[i];
        if(!sheet){
            continue
        }
        sheet.elem.setAttribute('data-sheet-order',i.toString());

        if(sheet.inserted){
            if(prev && prev.elem!==sheet.elem.previousElementSibling){
                sheet.inserted=false;
                sheet.elem.remove();
            }
        }

        if(!sheet.inserted){
            sheet.inserted=true;
            if(!prev){
                document.head.append(sheet.elem);
            }else{
                prev.elem.insertAdjacentElement('afterend',sheet.elem);
            }
        }

        prev=sheet;
    }
}

export const useDomSharedStyleSheets=(enabled=true)=>{

    useEffect(()=>{
        if(!enabled){
            return;
        }
        const sub=sharedStyleSheetsUpdateSubject.subscribe(updateSheets);
        return ()=>{
            sub.unsubscribe();
        }
    },[enabled]);

}
