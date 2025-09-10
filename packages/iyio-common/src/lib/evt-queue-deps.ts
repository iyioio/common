import { EvtQueue } from "./EvtQueue.js";
import { defineService } from "./scope-lib.js";

export const evtQueue=defineService<EvtQueue>('EvtQueue',()=>new EvtQueue());
