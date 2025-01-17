import { BehaviorSubject } from "rxjs";
import { DisposeCallback } from "./common-types";

export const incrementBehaviourSubject=(subject:BehaviorSubject<number>):number=>{
    const n=subject.value+1;
    subject.next(n);
    return n;
}
export const decrementBehaviourSubject=(subject:BehaviorSubject<number>):number=>{
    const n=subject.value-1;
    subject.next(n);
    return n;
}
export const incrementBehaviourSubjectWithDispose=(subject:BehaviorSubject<number>):DisposeCallback=>{
    subject.next(subject.value+1);
    return ()=>{
        subject.next(subject.value-1);
    }
}
