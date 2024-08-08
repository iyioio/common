import { EvtQueue } from "./EvtQueue";
import { defineService } from "./scope-lib";

export const evtQueue=defineService<EvtQueue>('EvtQueue',()=>new EvtQueue());
