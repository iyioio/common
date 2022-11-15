import { useEffect, useMemo } from "react";
import { allPortals, createPortalItem, PortalCtrl } from "./portal-lib";
import { useSubject } from "./rxjs-hooks";

export interface PortalProps
{
    /**
     * The id of the PortalRenderer to render children to.
     * @default "default"
     */
    rendererId?:string;
    children?:any;
}

export function Portal({
    rendererId='default',
    children
}:PortalProps){

    const ctrls=useSubject(allPortals);
    const ctrl:PortalCtrl|undefined=ctrls[rendererId];
    const item=useMemo(()=>ctrl?createPortalItem():null,[ctrl]);

    useEffect(()=>{
        if(!item){
            return;
        }
        item.render=()=>children;
        item.renderIndex.next(item.renderIndex.value+1);
    },[children,item]);

    useEffect(()=>{
        if(!ctrl || !item){
            return;
        }
        ctrl.addItem(item);
        return ()=>{
            ctrl.removeItem(item);
        }
    },[item,ctrl])

    return null;

}
