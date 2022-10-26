import { BehaviorSubject } from "rxjs";

export type ReadonlySubject<T>=Omit<BehaviorSubject<T>,'next'>;
