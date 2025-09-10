import { IDisposable } from "./common-types.js";
import { ReadonlySubject } from "./rxjs-types.js";

export interface ValuePointer<T=any> extends IDisposable
{
    readonly subject:ReadonlySubject<T|undefined>;
    get value():T|undefined;
}

export interface ListPointer<T=any> extends IDisposable
{
    readonly changeCount:ReadonlySubject<number>;
    readonly list:ReadonlyArray<T>;
}
