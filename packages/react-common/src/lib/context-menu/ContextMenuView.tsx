import { atDotCss } from "@iyio/at-dot-css";
import { BaseLayoutProps, ContextMenuCtrl } from "@iyio/common";
import { CSSProperties, useEffect } from "react";
import { UseContextMenuProps, useBaseContextMenu } from "./context-menu-lib.js";

export interface ContextMenuViewProps
{
    children?:any;
    style?:CSSProperties;
    onCtrl?:(menuCtrl:ContextMenuCtrl)=>void;
}

export function ContextMenuView({
    children,
    style:styleProp,
    onCtrl,
    ...props
}:ContextMenuViewProps & Omit<UseContextMenuProps,'elem'> & BaseLayoutProps){

    const {menuView,menuCtrl,setContextMenuElem}=useBaseContextMenu(props);

    useEffect(()=>{
        onCtrl?.(menuCtrl);
    },[onCtrl,menuCtrl]);

    return (
        <div
            ref={setContextMenuElem}
            className={style.root(null,null,props)}
            style={styleProp}
        >
            {children}
            {menuView}
        </div>
    )

}

const style=atDotCss({name:'ContextMenuView',css:`
    @.root{
        display:flex;
        flex-direction:column;
    }
`});
