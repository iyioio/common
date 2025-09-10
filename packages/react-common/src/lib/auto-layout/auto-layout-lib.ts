import { BaseLayoutProps } from "@iyio/common";
import { CSSProperties } from "react";
import { AutoLayoutCtrl } from "./AutoLayoutCtrl.js";

export interface AutoLayoutSlotOptions
{
    stackingMinHeight?:string;
    stackingAspectRatio?:string;
    primarySize?:string;
    minSize?:string;
    maxSize?:string;
}

export interface AutoLayoutTypeProps
{
    childAry:any[];
    count:number;
    ctrl:AutoLayoutCtrl;
    layoutProps:BaseLayoutProps;
    slotOptions:AutoLayoutSlotOptions;
}

export interface AutoLayoutCompInfo
{
    comp:any;
    className?:string;
    style?:CSSProperties;
}
