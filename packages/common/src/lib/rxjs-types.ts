import type { BehaviorSubject } from "rxjs/internal/BehaviorSubject";

export type ReadonlySubject<T>=Omit<BehaviorSubject<T>,'next'>;
