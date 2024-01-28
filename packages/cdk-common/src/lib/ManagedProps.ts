import { AccessManager } from "./AccessManager";
import { BridgeEvent } from "./BridgeEvent";
import { ParamOutput } from "./ParamOutput";
import { ApiRouteTarget, IApiRouter, IEventTarget, IHasUserPool, NamedBucket, NamedFn, NamedQueue, SiteContentSource } from "./cdk-types";

export interface ManagedProps
{
    readonly params?:ParamOutput;

    readonly accessManager?:AccessManager;

    readonly siteContentSources:SiteContentSource[];

    readonly fns:NamedFn[];

    readonly buckets:NamedBucket[];

    readonly queues:NamedQueue[];

    readonly events:BridgeEvent[];

    readonly eventTargets:IEventTarget[];

    readonly apiRouters:IApiRouter[];

    readonly apiRouteTargets:ApiRouteTarget[];

    readonly userPools:IHasUserPool[];

    readonly beforeOutputs:((managed:ManagedProps)=>void)[];


}

export const getDefaultManagedProps=():ManagedProps=>({
    siteContentSources:[],
    fns:[],
    buckets:[],
    queues:[],
    beforeOutputs:[],
    events:[],
    eventTargets:[],
    apiRouters:[],
    apiRouteTargets:[],
    userPools:[],
})
