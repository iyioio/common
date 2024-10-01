import { BaseLayoutProps } from "@iyio/common";
import { AutoLayoutCtrl } from "./AutoLayoutCtrl";

export interface AutoLayoutSlotOptions
{
    stackingMinHeight?:string;
    stackingAspectRatio?:string;
    primarySize?:string;
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
}
