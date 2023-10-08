import { BehaviorSubject } from "rxjs";
import { SharedStyleSheet } from "./shared-style-sheets-types";

export const sharedStyleSheets:SharedStyleSheet[]=[];

export const sharedStyleSheetsUpdateSubject=new BehaviorSubject<number>(0);
