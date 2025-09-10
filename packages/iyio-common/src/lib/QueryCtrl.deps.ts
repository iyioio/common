import { defaultQueryRecordStorePath } from "./query-ctrl-lib.js";
import { QueryCtrl } from "./QueryCtrl.js";
import { defineServiceFactory, defineStringParam } from "./scope-lib.js";

export const queryCtrlFactory=defineServiceFactory<QueryCtrl>('queryCtrlFactory',scope=>QueryCtrl.fromScope(scope));
export const queryRecordStorePathParam=defineStringParam('queryRecordStorePath',defaultQueryRecordStorePath);
