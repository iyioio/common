import { IDisposable } from "./common-types";
import { ReadonlySubject } from "./rxjs-types";

export interface ValuePointer<T=any> extends IDisposable
{
    value:ReadonlySubject<T>;
}
export interface ListPointer<T=any> extends IDisposable
{
    changeCount:ReadonlySubject<number>;
    list:ReadonlyArray<T>;
}
