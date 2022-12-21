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

export const useRouteQuery=():HashMap<string|string[]|undefined>=>{
    const {query}=useRoute();
    return query;
}

export const RouteCtx=createContext<RouteInfo|null>(null);
