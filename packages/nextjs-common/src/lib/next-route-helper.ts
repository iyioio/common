import { RouteInfo, getObjKeyCount } from "@iyio/common";
import { NextRouter } from "next/router";

export const getRouteInfo=(router:NextRouter):RouteInfo=>{

    const q=router.query??{}

    return {
        key:(router.isReady?'':'not-ready-')+(router as any)._key+'_'+getObjKeyCount(q),
        path:router.pathname,
        asPath:router.asPath,
        route:router.route,
        query:{...q},
    }
}
