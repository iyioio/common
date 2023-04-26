import { BehaviorSubject } from "rxjs";
import { UiLock, UiLockContainer } from "./ui-lock-types";

let nextId=1;
export function getNextUiLockId(){
    return nextId++;
}

export const createUiLockContainer=():UiLockContainer=>
{
    const locksSubject=new BehaviorSubject<UiLock[]>([]);

    return {
        locksSubject
    }
}
