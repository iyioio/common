import { Construct } from "constructs";
import { ParamOutput } from "./ParamOutput";

export interface HasParams
{
    readonly params:ParamOutput;
}

export type ScopeWithParams=Construct & HasParams;
