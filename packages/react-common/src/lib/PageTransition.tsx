import { cn, getObjKeyCount, HashMap, isServerSide, RouteInfo } from "@iyio/common";
import { useEffect, useRef, useState } from "react";
import { RouteCtx } from "./useRoute.js";

let childId=0;
let firstKey:string|null=null;

interface ChildRef
{
    children:any;
    id:number;
    routeInfo:RouteInfo;
}

interface PageTransitionProps
{
    duration?:number;
    routeInfo:RouteInfo;
    children:any;
}

/**
 * @acIgnore
 */
export function PageTransition({
    routeInfo,
    duration=1500,
    children
}:PageTransitionProps){

    const pathKey=routeInfo.key??'default';
    if(!firstKey){
        firstKey=pathKey;
    }
    const childCache=useRef<HashMap<ChildRef>>({});
    const currentPathKey=useRef(pathKey);
    currentPathKey.current=pathKey;

    if(isServerSide){
        childCache.current={
            [pathKey]:{
                id:++childId,
                children,
                routeInfo
            }
        }
    }else{
        if(!childCache.current[pathKey]){
            childCache.current[pathKey]={
                id:++childId,
                children,
                routeInfo
            };
        }
    }
    const cachedCurrent=childCache.current[pathKey]
    if(cachedCurrent){
        cachedCurrent.children=children;
    }

    const dur=useRef(duration);
    dur.current=duration;
    const [,render]=useState(0);
    useEffect(()=>{
        if(isServerSide){
            return;
        }
        return ()=>{
            setTimeout(()=>{
                if(pathKey!==currentPathKey.current){
                    delete childCache.current[pathKey];
                    render(v=>v+1);
                }
            },dur.current);
        }
    },[pathKey]);

    return (
        <div className={cn("PageTransition",{inTrans:getObjKeyCount(childCache.current)>1})}>
            <div className="PageTransition-container">
                {Object.keys(childCache.current).map((k)=>(
                    <div className={"PageTransition-item "+(isServerSide?'':pathKey===k?k===firstKey?'':'enter':'exit')} key={k}>
                        <ChildView child={childCache.current[k]} />
                    </div>
                ))}
            </div>
        </div>
    )
}


interface ChildViewProps
{
    child:ChildRef|undefined;
}

function ChildView({
    child
}:ChildViewProps){

    return (
        <RouteCtx.Provider value={child?.routeInfo??null}>
            {child?.children}
        </RouteCtx.Provider>
    )

}
