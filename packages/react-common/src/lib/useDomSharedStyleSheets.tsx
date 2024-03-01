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
        if(!s || sheets.some(st=>st.sheet.id===s.id)){
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
        if(!sheet || sheet.inserted){
            continue
        }
        sheet.inserted=true;
        if(!prev){
            document.head.append(sheet.elem);
            continue;
        }

        prev.elem.insertAdjacentElement('afterend',sheet.elem);

        prev=sheet;
    }
}

export const useDomSharedStyleSheets=()=>{

    useEffect(()=>{
        const sub=sharedStyleSheetsUpdateSubject.subscribe(updateSheets);
        return ()=>{
            sub.unsubscribe();
        }
    },[]);

}
