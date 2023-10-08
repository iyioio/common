import { aryRemoveFirst } from "./array";
import { getStyleSheetOrder } from "./css-order";
import { sharedStyleSheets, sharedStyleSheetsUpdateSubject } from "./shared-style-sheets";
import { ISharedStyleSheetRenderer, SharedStyleSheet } from "./shared-style-sheets-types";

export class SharedStyleSheetRenderer implements ISharedStyleSheetRenderer
{

    public addSheet(options:SharedStyleSheet):void
    {
        const order=getStyleSheetOrder(options.order);

        const styles=sharedStyleSheets;

        let inserted=false;

        for(let i=0;i<styles.length;i++){
            const existingStyle=styles[i]
            if(!existingStyle){
                continue;
            }

            const o=getStyleSheetOrder(existingStyle.order);
            if(isFinite(o) && order<o){
                styles.splice(i,0,options);
                inserted=true;
                break;
            }
        }

        if(!inserted){
            styles.push(options);
        }

        sharedStyleSheetsUpdateSubject.next(sharedStyleSheetsUpdateSubject.value+1);
    }

    public removeSheet(id:string):boolean
    {
        if(aryRemoveFirst(sharedStyleSheets,s=>s.id===id)){
            sharedStyleSheetsUpdateSubject.next(sharedStyleSheetsUpdateSubject.value+1);
            return true;
        }else{
            return false;
        }
    }
}
