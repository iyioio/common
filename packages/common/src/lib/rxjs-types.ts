import { RxJsBehaviorSubject } from "./rxjs-stubs";

export type ReadonlySubject<T>=Omit<RxJsBehaviorSubject<T>,'next'>;
