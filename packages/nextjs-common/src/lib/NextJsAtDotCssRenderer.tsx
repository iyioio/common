import { IAtDotCssRenderer } from "@iyio/at-dot-css";
import { AtDotStyle, aryRemoveFirst, getStyleSheetOrder } from "@iyio/common";
import { sharedStyleSheets, sharedStyleSheetsUpdateSubject } from "./useSharedStyleSheets.internal";

export class NextJsAtDotCssRenderer implements IAtDotCssRenderer
{
    public addSheet(id:string,options:AtDotStyle<string>):void
    {
        const order=getStyleSheetOrder(options.order);

        const styles=sharedStyleSheets as AtDotStyle<string>[];

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

