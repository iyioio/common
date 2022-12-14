import { defaultQueryRecordStorePath } from "./query-ctrl-lib";
import { QueryCtrl } from "./QueryCtrl";
import { defineServiceFactory, defineStringParam } from "./scope-lib";

export const queryCtrlFactory=defineServiceFactory<QueryCtrl>('queryCtrlFactory',scope=>QueryCtrl.fromScope(scope));
export const queryRecordStorePathParam=defineStringParam('queryRecordStorePath',defaultQueryRecordStorePath);
