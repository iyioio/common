import { BehaviorSubject } from "rxjs";

export const incrementBehaviourSubject=(subject:BehaviorSubject<number>):number=>{
    const n=subject.value+1;
    subject.next(n);
    return n;
}
