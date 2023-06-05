import { HashMap, RouteInfo, uuid } from "@iyio/common";
import { createContext, useContext, useMemo } from "react";

export const useRoute=():RouteInfo=>
{
    const route=useContext(RouteCtx);
    return useMemo<RouteInfo>(()=>route??{
        key:uuid(),
        path:'/',
        asPath:'/',
        route:'/',
        query:{}
    },[route]);
}

export const useRouteQueryMulti=():HashMap<string|string[]|undefined>=>{
    const {query}=useRoute();
    return query;
}
export const useRouteQuery=():HashMap<string>=>{
    const {query}=useRoute();
    return useMemo(()=>{
        const q:Record<string,string>={}
        if(!query){
            return q;
        }
        for(const e in query){
            const v=query[e];
            if(Array.isArray(v)){
                q[e]=v[0]??'';
            }else{
                q[e]=v??'';
            }
        }
        return q;
    },[query])
}

export const RouteCtx=createContext<RouteInfo|null>(null);
