import { BehaviorSubject } from "rxjs";

export const uiReadySubject=new BehaviorSubject<boolean>(false);
export const uiReadyDelayedSubject=new BehaviorSubject<boolean>(false);
