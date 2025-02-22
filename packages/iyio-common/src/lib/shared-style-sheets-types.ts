import { StyleSheetOrder } from "./css-order";

export interface SharedStyleSheet
{
    id:string;
    css:string;
    hash?:string;
    order?:number|StyleSheetOrder;
}

export interface ISharedStyleSheetRenderer
{
    addSheet(sheet:SharedStyleSheet):void;
    removeSheet(id:string):boolean;
}
