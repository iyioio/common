import { AtDotStyle } from "@iyio/common";

export interface IAtDotCssRenderer
{
    addSheet(id:string,options:AtDotStyle<string>):void;
    removeSheet(id:string):boolean;
}
