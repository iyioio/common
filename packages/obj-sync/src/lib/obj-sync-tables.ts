import { DataTableDescription } from '@iyio/common';
import { ObjSyncClientConnection, ObjSyncClientConnectionScheme, ObjSyncObjState, ObjSyncObjStateScheme } from "./obj-sync-types";
import { objSyncClientConnectionTableParam, objSyncObjStateTableParam } from "./obj-sync.deps";

export const ObjSyncConnectionTable:DataTableDescription<ObjSyncClientConnection>={
    name:"ObjSyncConnection",
    primaryKey:"objId",
    sortKey:"clientId",
    tableIdParam:objSyncClientConnectionTableParam,
    scheme:ObjSyncClientConnectionScheme,
}
export const ObjSyncConnectionTableIndexMap={
    //"obj":ObjSyncConnectionTable.indexes?.[0] as DataTableIndex,
    //"socket":ObjSyncConnectionTable.indexes?.[1] as DataTableIndex,
}

export const ObjSyncObjStateTable:DataTableDescription<ObjSyncObjState>={
    name:"ObjSyncObjState",
    primaryKey:"objId",
    tableIdParam:objSyncObjStateTableParam,
    scheme:ObjSyncObjStateScheme,
}
