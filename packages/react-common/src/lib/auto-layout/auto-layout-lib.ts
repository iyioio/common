import { BaseLayoutProps } from "@iyio/common";
import { AutoLayoutCtrl } from "./AutoLayoutCtrl";

export interface AutoLayoutTypeProps
{
    childAry:any[];
    count:number;
    ctrl:AutoLayoutCtrl;
    layoutProps:BaseLayoutProps;
}

export interface AutoLayoutCompInfo
{
    comp:any;
    className?:string;
}
