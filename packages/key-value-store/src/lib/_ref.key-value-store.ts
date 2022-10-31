import { createTypeRef } from "@iyio/common";
import { IKeyValueStore, KeyValueStoreProvider } from "./key-value-store-types";

export const IKeyValueStoreRef=createTypeRef<IKeyValueStore|KeyValueStoreProvider>("IKeyValueStore");
