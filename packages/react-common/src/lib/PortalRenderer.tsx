import { useEffect, useRef } from "react";
import { getPortalCtrl, PortalCtrl, PortalItem } from "./portal-lib";
import { useSubject } from "./rxjs-hooks";

interface PortalRendererProps
{
    id?:string;
    getCtrl?:(ctrl:PortalCtrl)=>void;
}

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
