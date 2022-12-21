import { RouteInfo } from "@iyio/common";
import { NextRouter } from "next/router";

export const getRouteInfo=(router:NextRouter):RouteInfo=>{
    return {
        key:(router as any)._key,
        path:router.pathname,
        asPath:router.asPath,
        route:router.route,
        query:{...(router.query??{})},
    }
}
