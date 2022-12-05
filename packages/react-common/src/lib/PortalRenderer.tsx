import { useEffect, useRef } from "react";
import { getPortalCtrl, PortalItem } from "./portal-lib";
import { useSubject } from "./rxjs-hooks";

interface PortalRendererProps
{
    id?:string;
}

export function PortalRenderer({
    id='default'
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
