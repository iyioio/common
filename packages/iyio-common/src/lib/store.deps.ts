import { RouterStore } from "./RouterStore";
import { defineProvider, defineService } from "./scope-lib";
import { IStore, StoreProvider } from "./store-types";

export const storeRoot=defineService<RouterStore>("storeRoot",scope=>new RouterStore(scope));
export const StoreProviders=defineProvider<StoreProvider|IStore>("StoreProviders");
