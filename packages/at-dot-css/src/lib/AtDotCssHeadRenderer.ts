import { AtDotCssOptions, getStyleSheetOrder } from "@iyio/common";
import { IAtDotCssRenderer } from "./at-dot-css-lib-types";

const orderAtt='data-at-dot-css-order';

export class AtDotCssHeadRenderer implements IAtDotCssRenderer
{
    public addSheet(id:string,options:AtDotCssOptions<string>):void
    {
        if(!globalThis.document?.createElement){
            return;
        }
        const order=getStyleSheetOrder(options.order);

        const style=globalThis.document.createElement('style');
        style.id=id;
        style.setAttribute(orderAtt,order.toString());
        style.innerHTML=options.css;
        style.setAttribute('type',"text/css");

        const styles=globalThis.document.head.querySelectorAll(`style[${orderAtt}]`);

        for(let i=0;i<styles.length;i++){
            const existingStyle=styles.item(i);
            if(!existingStyle){
                continue;
            }

            const o=Number(existingStyle.getAttribute(orderAtt));
            if(isFinite(o) && order<o){
                globalThis.document.head.insertBefore(style,existingStyle);
                return;
            }
        }

        const before=globalThis.document.head.querySelector('link,style');
        if(before){
            globalThis.document.head.append(style);
        }else{
            globalThis.document.head.append(style);
        }
    }

    public removeSheet(id:string):boolean
    {
        const elem=globalThis.document?.getElementById(id);
        if(!elem){
            return false;
        }
        elem.remove();
        return true;
    }
}
