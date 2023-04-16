import type { AccessManager } from "./AccessManager";
import type { ParamOutput } from "./ParamOutput";

export interface ManagedProps
{
    readonly params?:ParamOutput;

    readonly accessManager?:AccessManager;
}
