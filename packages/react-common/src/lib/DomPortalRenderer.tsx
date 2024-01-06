import { BaseLayoutProps, bcn } from "@iyio/common";
import { CSSProperties, useState } from "react";
import { PersistencePortalNodeOptions, useDomPortalRenderTarget } from "./dom-portal-lib";


export interface DomPortalRendererProps extends PersistencePortalNodeOptions
{
    id:string|null|undefined;
    style?:CSSProperties;
    /**
     * If true persistenceId will be set to the same value as id
     */
    persist?:boolean;
}

export function DomPortalRenderer({
    id,
    style: styleProp,
    persist,
    persistenceId=persist?(id??undefined):undefined,
    persistenceClassName,
    persistenceLayoutProps,
    ...props
}:DomPortalRendererProps & BaseLayoutProps){

    const [node,setNode]=useState<HTMLElement|null>(null);

    useDomPortalRenderTarget({id,node,persistenceId,persistenceClassName,persistenceLayoutProps});

    return (
        <div className={bcn(props)} style={styleProp} ref={setNode}/>
    )

}

