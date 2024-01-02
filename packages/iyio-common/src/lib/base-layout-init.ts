import { BaseLayoutCssOptions } from "./base-layout-generator-types";
import { currentBreakpoints } from "./window-size-lib";

let baseLayoutInited=false;

export const isBaseLayoutInited=()=>baseLayoutInited;

export const initBaseLayout=(options:BaseLayoutCssOptions)=>{
    if(baseLayoutInited){
        return;
    }

    baseLayoutInited=true;

    if(options.breakpoints){
        currentBreakpoints.next(options.breakpoints);
    }

}
