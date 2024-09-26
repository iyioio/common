import { BaseLayoutProps, CompObj, CompObjRenderOptions, getObjKeyCount, renderCompObj } from "@iyio/common";
//@ts-ignore
import { jsx, jsxs } from "react/jsx-runtime";


export interface CompObjViewProps
{
    comp?:CompObj;
    compOptions?:CompObjRenderOptions;
}

export function CompObjView({
    comp,
    compOptions,
    ...props
}:CompObjViewProps & BaseLayoutProps & Record<string,any>){

    if(!comp){
        return null;
    }

    if(getObjKeyCount(props)){
        comp={...comp}
        comp.props={...comp.props,...props}
    }

    return renderCompObj(comp,jsxs,jsx,compOptions)

}
