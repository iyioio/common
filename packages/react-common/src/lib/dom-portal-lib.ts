import { BaseLayoutProps, bcn, pushBehaviorSubjectAry, removeBehaviorSubjectAryValue } from "@iyio/common";
import { useEffect, useMemo, useRef } from "react";
import { BehaviorSubject } from "rxjs";

export const domPortalRenderers=new BehaviorSubject<DomPortalRenderTarget[]>([]);

const pNodes:Record<string,HTMLElement>={};

const updatePNode=({
    persistenceId,
    persistenceClassName,
    persistenceLayoutProps
}:PersistencePortalNodeOptions)=>{
    if(!persistenceId){
        return;
    }
    const node=pNodes[persistenceId];
    if(!node){
        return;
    }
    node.className=(
        persistenceLayoutProps?
            bcn(persistenceLayoutProps,persistenceClassName):
            persistenceClassName
    )??''
}

const getPNode=(options:PersistencePortalNodeOptions)=>{
    if(!options.persistenceId){
        return undefined;
    }
    let node=pNodes[options.persistenceId];
    if(node){
        return node;
    }
    if(!globalThis.document){
        return null;
    }

    node=globalThis.document.createElement('div');
    pNodes[options.persistenceId]=node;
    updatePNode(options);
    return node;
}

export interface DomPortalRenderTarget
{
    id:string;
    node:Element|DocumentFragment;
}

export interface PersistencePortalNodeOptions
{

    /**
     * When defined the portal renderer's content will be attached to a persistance DOM node allowing
     * the state of rendered nodes to be persisted. This has the effect of inserting a new DOM
     * node between the portal renderer node and the content being rendered. Portal renderers using
     * the same persistenceId will share the same persistence node.
     */
    persistenceId?:string;

    /**
     * Class name given to the generated persistence node.
     */
    persistenceClassName?:string;

    /**
     * Base Layout Props passed to the persistence node.
     */
    persistenceLayoutProps?:BaseLayoutProps;
}

export interface UseDomPortalRenderTargetProps extends PersistencePortalNodeOptions
{
    id:string|null|undefined;
    node:Element|DocumentFragment|null|undefined;
}

export const useDomPortalRenderTarget=({
    id,
    node,
    persistenceId,
    persistenceClassName,
    persistenceLayoutProps,
}:UseDomPortalRenderTargetProps)=>{

    const pPropsRef=useRef<PersistencePortalNodeOptions>(
        {persistenceId,persistenceClassName,persistenceLayoutProps}
    );
    pPropsRef.current.persistenceId=persistenceId;
    pPropsRef.current.persistenceClassName=persistenceClassName;
    pPropsRef.current.persistenceLayoutProps=persistenceLayoutProps;

    const pNode=useMemo(()=>{
        if(!persistenceId){
            return undefined;
        }
        if(!globalThis.window){
            return null;
        }

        return getPNode(pPropsRef.current)

    },[persistenceId]);

    useEffect(()=>{
        if(!persistenceId){
            return;
        }
        updatePNode(pPropsRef.current);
    },[persistenceId,persistenceClassName,persistenceLayoutProps]);

    useEffect(()=>{
        if(!node || !id || pNode===null){
            return;
        }

        if(pNode){
            node.appendChild(pNode);
        }

        const target=pushBehaviorSubjectAry(domPortalRenderers,{
            id,
            node:pNode??node,
        });

        return ()=>{
            if(pNode){
                node.removeChild(pNode);
            }
            removeBehaviorSubjectAryValue(domPortalRenderers,target);
        }
    },[id,node,pNode]);

}
