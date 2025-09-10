import { useSubject } from "@iyio/react-common";
import { AnyCompViewCtrl } from "./AnyCompViewCtrl.js";


export interface AnyCompProps
{
    ctrl?:AnyCompViewCtrl;
    placeholder?:any;
}

export function AnyComp({
    ctrl,
    placeholder
}:AnyCompProps){

    const comp=ctrl?.comp;

    const props=useSubject(ctrl?.computedPropsSubject);

    return (
        ((typeof comp?.comp === 'function') && props)?comp.comp(props,placeholder):null
    )
}
