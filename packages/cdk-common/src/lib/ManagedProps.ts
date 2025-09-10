import * as iam from "aws-cdk-lib/aws-iam";
import { AccessManager } from "./AccessManager.js";
import { BridgeEvent } from "./BridgeEvent.js";
import { ParamOutput } from "./ParamOutput.js";
import { ApiRouteTarget, IEventTarget, IHasUserPool, NamedBucket, NamedFn, NamedQueue, NamedResource, SiteContentSource } from "./cdk-types.js";

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

    readonly apiRouteTargets:ApiRouteTarget[];

    readonly userPools:IHasUserPool[];

    readonly resources:NamedResource[];

    readonly beforeOutputs:((managed:ManagedProps)=>void)[];

    getEventBridgeLambdaInvokeRole?():iam.Role;


}

export const getDefaultManagedProps=():ManagedProps=>({
    siteContentSources:[],
    fns:[],
    buckets:[],
    queues:[],
    beforeOutputs:[],
    events:[],
    eventTargets:[],
    apiRouteTargets:[],
    userPools:[],
    resources:[],
})
