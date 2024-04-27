import { defineService, defineStringParam } from "@iyio/common";
import { ConvoLocalStorageGraphStore } from "./ConvoLocalStorageGraphStore";
import { ConvoMemoryGraphStore } from "./ConvoMemoryGraphStore";
import { ConvoGraphStore } from "./convo-graph-types";
import { ConvoCompletionService } from "./convo-types";

export const convoCompletionService=defineService<ConvoCompletionService>('ConvoCompletionService');

export const convoCapabilitiesParams=defineStringParam('convoCapabilities');

export const convoGraphStore=defineService<ConvoGraphStore>('ConvoGraphStore',()=>
    globalThis.localStorage?
        new ConvoLocalStorageGraphStore():
        new ConvoMemoryGraphStore()
);
