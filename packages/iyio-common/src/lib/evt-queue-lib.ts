import { Evt } from "./Evt.js";

export type EvtQueueListener=(topic:string,evts:Evt[])=>Promise<void>|void;

