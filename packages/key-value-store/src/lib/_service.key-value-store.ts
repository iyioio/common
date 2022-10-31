import { createServiceRef } from "@iyio/common";
import { RouterStore } from "./RouterStore";

export const store=createServiceRef<RouterStore>('store',deps=>new RouterStore(deps));
