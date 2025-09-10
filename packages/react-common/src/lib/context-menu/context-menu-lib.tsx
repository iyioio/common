import { atDotCss } from "@iyio/at-dot-css";
import { ContextMenuCtrl, UiActionItem, camelCaseToSnakeCase } from "@iyio/common";
import { Fragment, ReactNode, useEffect, useMemo, useState } from "react";
import { Portal } from "../Portal.js";
import { SlimButton, SlimButtonProps } from "../SlimButton.js";
import { useSubject } from "../rxjs-hooks.js";

export const defaultContextMenuTargetIdAttribute='data-context-menu-target-id';

export interface UseContextMenuProps
{
    elem?:HTMLElement|null;
    content?:any;
    contentAfterItems?:boolean;
    items?:UiActionItem[];
    disabled?:boolean;
    zIndex?:number;
    action?:(targetId:string|undefined,action:UiActionItem)=>void;
    /**
     * If not null or undefined items click on must have the specified class name or a parent of
     * the element must have the specified class name
     */
    targetClassName?:string|null;
    targetIdAttribute?:string;

    xOffset?:string;
    yOffset?:string;

    renderBody?:(bodyContent:any,ctrl:ContextMenuCtrl)=>any;
    bodyClassName?:string;

    renderItemContent?:(item:UiActionItem,ctrl:ContextMenuCtrl)=>any;
    itemButtonProps?:Omit<SlimButtonProps,'actionItem'>;
    renderIcon?:(icon:string,iconColor:string|undefined,ctrl:ContextMenuCtrl)=>any;
    itemClassName?:string;

}

export interface UseContextMenuState
{
    menuView:ReactNode;
    setContextMenuElem:(elem:HTMLElement|null)=>void;
    contextMenuElem:HTMLElement|null;
    menuTarget:Element|null;
    targetId:string|undefined;
    menuCtrl:ContextMenuCtrl;
}


export const useBaseContextMenu=({
    elem:elemProp,
    disabled,
    content,
    contentAfterItems,
    items,
    targetClassName,
    targetIdAttribute=defaultContextMenuTargetIdAttribute,
    zIndex,
    action,

    xOffset='0px',
    yOffset='0px',

    renderBody,
    bodyClassName,

    itemButtonProps,
    renderIcon,
    renderItemContent,
    itemClassName,
}:UseContextMenuProps):UseContextMenuState=>{

    const [elem,setElem]=useState<HTMLElement|null>(elemProp??null);
    const [menuElem,setMenuElem]=useState<HTMLElement|null>(null);

    const menuCtrl=useMemo(()=>new ContextMenuCtrl(),[]);
    const menuTarget=useSubject(menuCtrl.targetElemSubject);

    const targetId:string|undefined=(
        menuTarget?.getAttribute(targetIdAttribute)??
        menuTarget?.getAttribute(camelCaseToSnakeCase(targetIdAttribute,'-','lower'))??
        undefined
    )


    useEffect(()=>{
        if(elemProp!==undefined){
            setElem(elemProp);
        }
    },[elemProp]);

    useEffect(()=>{
        menuCtrl.elem=elem;
        return ()=>{
            if(menuCtrl.elem===elem){
                menuCtrl.elem=null;
            }
        }
    },[elem,menuCtrl]);

    useEffect(()=>{
        if(disabled!==undefined){
            menuCtrl.disabled=disabled;
        }
    },[disabled,menuCtrl]);

    useEffect(()=>{
        if(targetClassName!==undefined){
            menuCtrl.targetClassName=targetClassName;
        }
    },[targetClassName,menuCtrl]);

    useEffect(()=>{
        menuCtrl.menuElem=menuElem;
    },[menuElem,menuCtrl]);

    useEffect(()=>{
        return ()=>{
            menuCtrl.dispose();
        }
    },[menuCtrl]);

    const pos=useSubject(menuCtrl.positionSubject);
    const open=useSubject(menuCtrl.openSubject);


    const bodyContent=(
        <Fragment>
            {!contentAfterItems && content}
            {items?.map((item,i)=>(
                <SlimButton
                    {...itemButtonProps}
                    key={item.mapKey??item.id??i}
                    className={style.contextMenuItem(null,itemClassName)}
                    actionItem={item}
                    onClick={()=>{
                        menuCtrl.close();
                        itemButtonProps?.onClick?.();
                        action?.(targetId,item);
                    }}
                >
                    {renderItemContent?renderItemContent(item,menuCtrl):<>
                        {item.icon && renderIcon?.(item.icon,item.iconColor,menuCtrl)}
                        {item.title}
                    </>}
                </SlimButton>
            ))}
        </Fragment>
    )

    const body=renderBody?renderBody(bodyContent,menuCtrl):(
        <div className={style.contextMenuBody(null,bodyClassName)}>
            {bodyContent}
        </div>
    )

    const menuView=(pos && open)?(
        <Portal>
            <div ref={setMenuElem} className={style.contextMenuContainer()} style={style.vars({
                x:pos.x+'px',
                y:pos.y+'px',
                xOffset:xOffset,
                yOffset:yOffset,
                zIndex,
            })}>
                {body}
            </div>
        </Portal>
    ):null;

    return {
        menuView,
        contextMenuElem:elem,
        setContextMenuElem:setElem,
        menuCtrl,
        menuTarget,
        targetId,
    }

}

const style=atDotCss({name:'context-menu-lib',namespace:'iyio',order:'framework',css:`
    @.contextMenuContainer{
        position:absolute;
        left:0;
        top:0;
        transform:translate( calc( @@x + @@xOffset ) , calc( @@y + @@yOffset ) );
        z-index:@@zIndex;
    }
    @.contextMenuBody{
        display:flex;
        flex-direction:column;
    }
    @.contextMenuItem{
        gap:0.5rem;
        display:flex;
        align-items:center;
    }

`});
