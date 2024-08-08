import { Evt } from "./Evt";

export type EvtQueueListener=(topic:string,evts:Evt[])=>Promise<void>|void;

