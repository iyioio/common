import type { AccessManager } from "./AccessManager";
import type { ParamOutput } from "./ParamOutput";
import { NamedBucket, NamedFn, SiteContentSource } from "./cdk-types";

export interface ManagedProps
{
    readonly params?:ParamOutput;

    readonly accessManager?:AccessManager;

    readonly siteContentSources?:SiteContentSource[];

    readonly fns?:NamedFn[];

    readonly buckets?:NamedBucket[];


}
