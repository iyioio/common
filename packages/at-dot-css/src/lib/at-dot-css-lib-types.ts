import { AtDotCssOptions } from "@iyio/common";

export interface IAtDotCssRenderer
{
    addSheet(id:string,options:AtDotCssOptions<string>):void;
    removeSheet(id:string):boolean;
}
