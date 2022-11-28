import { aryRemoveItem, HashMap } from "@iyio/common";
import { useEffect, useMemo } from "react";
import { BehaviorSubject } from "rxjs";
import { useSubject } from "./rxjs-hooks";

export const allPortals=new BehaviorSubject<HashMap<PortalCtrl>>({});

export const defaultPortalRendererId='default'

let nextPortalItemId=1;
export const getPortalItemId=()=>nextPortalItemId++;

export interface PortalItem
{
    id:number;
    render(data?:any):any;
    data?:any;
    renderIndex:BehaviorSubject<number>;
}

export class PortalCtrl
{
    public readonly id:string;

    public readonly items:BehaviorSubject<PortalItem[]>=new BehaviorSubject<PortalItem[]>([])

    public constructor(id:string)
    {
        if(allPortals.value[id]){
            console.error(`A PortalCtrl with id ${id} already exists`);
        }
        this.id=id;
        allPortals.next({
            ...allPortals.value,
            [id]:this
        })
    }

    private _isDisposed=false;
    public get isDisposed(){return this._isDisposed}
    public dispose()
    {
        if(this._isDisposed){
            return;
        }
        this._isDisposed=true;

        if(allPortals.value[this.id]===this){
            const next={...allPortals.value};
            delete next[this.id];

            allPortals.next(next);
        }
    }

    public addItem(item:PortalItem)
    {
        this.items.next([...this.items.value,item]);
    }

    public removeItem(item:PortalItem)
    {
        const items=[...this.items.value];
        aryRemoveItem(items,item);
        this.items.next(items);
    }

}

export const createPortalItem=():PortalItem=>({
    id:getPortalItemId(),
    render(){return null},
    renderIndex:new BehaviorSubject(0),
})

export interface PortalProps
{
    /**
     * The id of the PortalRenderer to render children to.
     * @default defaultPortalRendererId
     */
    rendererId?:string;
    children?:any;
    active?:boolean;
}

export const usePortal=({
    rendererId=defaultPortalRendererId,
    active=true,
    children
}:PortalProps)=>
{

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
        if(!ctrl || !item || !active){
            return;
        }
        ctrl.addItem(item);
        return ()=>{
            ctrl.removeItem(item);
        }
    },[item,ctrl,active])
}
