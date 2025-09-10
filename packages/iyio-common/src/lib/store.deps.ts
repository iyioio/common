import { RouterStore } from "./RouterStore.js";
import { defineProvider, defineService } from "./scope-lib.js";
import { IStore, StoreProvider } from "./store-types.js";

export const storeRoot=defineService<RouterStore>("storeRoot",scope=>new RouterStore(scope));
export const StoreProviders=defineProvider<StoreProvider|IStore>("StoreProviders");
