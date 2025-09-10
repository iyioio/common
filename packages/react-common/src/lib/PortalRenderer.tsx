import { useEffect, useRef } from "react";
import { PortalCtrl, PortalItem, getPortalCtrl } from "./portal-lib.js";
import { useSubject } from "./rxjs-hooks.js";

interface PortalRendererProps
{
    id?:string;
    getCtrl?:(ctrl:PortalCtrl)=>void;
}

/**
 * @acIgnore
 */
export function PortalRenderer({
    id='default',
    getCtrl,
}:PortalRendererProps){

    const idRef=useRef(id);

    useEffect(()=>{
        if(id!==idRef.current){
            console.error(
                `Changing a PortalRenderer's id is not supported. id=${idRef.current}, changedId=${id}`);
        }
    },[id]);

    const ctrl=getPortalCtrl(id);

    useEffect(()=>{
        getCtrl?.(ctrl);
    },[getCtrl,ctrl]);

    useEffect(()=>{
        return ()=>{
            ctrl.dispose();
        }
    },[ctrl]);

    const items=useSubject(ctrl.items);

    return (
        <>
            {items.map(item=>(
                <PortalItemView key={item.id} item={item} />
            ))}

        </>
    )

}


interface PortalItemViewProps
{
    item:PortalItem;
}

function PortalItemView({
    item
}:PortalItemViewProps){

    useSubject(item.renderIndex);

    return item.render(item.data);

}
