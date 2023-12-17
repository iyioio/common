import { AccessManager } from "./AccessManager";
import { ParamOutput } from "./ParamOutput";
import { NamedBucket, NamedFn, NamedQueue, SiteContentSource } from "./cdk-types";

export interface ManagedProps
{
    readonly params?:ParamOutput;

    readonly accessManager?:AccessManager;

    readonly siteContentSources:SiteContentSource[];

    readonly fns:NamedFn[];

    readonly buckets:NamedBucket[];

    readonly queues:NamedQueue[];

    readonly beforeOutputs:((managed:ManagedProps)=>void)[]


}

export const getDefaultManagedProps=():ManagedProps=>({
    siteContentSources:[],
    fns:[],
    buckets:[],
    queues:[],
    beforeOutputs:[],
})
