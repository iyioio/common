import { DepConfig } from "./config";
import { createServiceRef } from "./TypeRef";

export const cf=createServiceRef<DepConfig>('cf',(deps)=>new DepConfig(deps));
