import { BehaviorSubject } from "rxjs";

/**
 * Removes the last value of the subject array and returns the removed value;
 */
export const popBehaviorSubjectAry=<T>(subject:BehaviorSubject<T[]>):T|undefined=>{

    if(!subject.value.length){
        return undefined;
    }

    const update=[...subject.value];
    const removed=update.pop();

    subject.next(update);

    return removed;
}

/**
 * Removes the first value of the subject array and returns the removed value;
 */
export const shiftBehaviorSubjectAry=<T>(subject:BehaviorSubject<T[]>):T|undefined=>{

    if(!subject.value.length){
        return undefined;
    }

    const update=[...subject.value];
    const removed=update.shift();

    subject.next(update);

    return removed;
}

/**
 * Removes the first matching value of the subject array and returns true if a match was founded
 */
export const removeBehaviorSubjectAryValue=<T>(subject:BehaviorSubject<T[]>,value:T|null|undefined):boolean=>{

    for(let i=0;i<subject.value.length;i++){
        const item=subject.value[i];
        if(item===value){
            const update=[...subject.value];
            update.splice(i,1);
            subject.next(update);
            return true;
        }
    }

    return false;
}

/**
 * Removes the all matching values of the subject array and returns the number of values removed
 */
export const removeAllBehaviorSubjectAryValue=<T>(subject:BehaviorSubject<T[]>,value:T|null|undefined):number=>{

    let removed=0;
    let ary:T[]=subject.value;;

    for(let i=0;i<ary.length;i++){
        const item=ary[i];
        if(value===item){
            if(!removed){
                ary=[...ary];
            }
            ary.splice(i,1);
            removed++;
            i--;
        }
    }

    if(removed){
        subject.next(ary);
    }

    return removed;
}

/**
 * Removes the first matching value for each item in the values array of the subject array and returns
 * the number of items removed
 */
export const removeBehaviorSubjectAryValueMany=<T>(subject:BehaviorSubject<T[]>,values:(T|null|undefined)[]):number=>{

    let removed=0;
    let ary:T[]=subject.value;;

    for(let i=0;i<ary.length;i++){
        const item=ary[i];
        const index=values.indexOf(item);
        if(index!==-1){
            if(!removed){
                values=[...values];
                ary=[...ary];
            }
            values.splice(index,1);
            ary.splice(i,1);
            removed++;
            i--;
        }
    }

    if(removed){
        subject.next(ary);
    }

    return removed;
}

/**
 * Removes the first matching value for each item in the values array of the subject array and returns
 * the number of items removed
 */
export const removeAllBehaviorSubjectAryValueMany=<T>(subject:BehaviorSubject<T[]>,values:(T|null|undefined)[]):number=>{

    let removed=0;
    let ary:T[]=subject.value;;

    for(let i=0;i<ary.length;i++){
        const item=ary[i];
        if(values.includes(item)){
            if(!removed){
                ary=[...ary];
            }
            ary.splice(i,1);
            removed++;
            i--;
        }
    }

    if(removed){
        subject.next(ary);
    }

    return removed;
}

/**
 * Appends the value to the end of the subject's array and returns the newly appended value.
 */
export const pushBehaviorSubjectAry=<T>(subject:BehaviorSubject<T[]>,value:T):T=>{

    subject.next([...subject.value,value]);

    return value;
}

/**
 * Appends the values to the end of the subject's array and returns the newly appended values.
 */
export const pushBehaviorSubjectAryMany=<T>(subject:BehaviorSubject<T[]>,values:T[]):T[]=>{

    subject.next([...subject.value,...values]);

    return values;
}
/**
 * Inserts the value at the start of the subject's array and returns the new value.
 */
export const unshiftBehaviorSubjectAry=<T>(subject:BehaviorSubject<T[]>,value:T):T=>{

    subject.next([value,...subject.value]);

    return value;
}

/**
 * Inserts the values at the start of the subject's array and returns the new value.
 */
export const unshiftBehaviorSubjectAryMany=<T>(subject:BehaviorSubject<T[]>,values:T[]):T[]=>{

    subject.next([...values,...subject.value]);

    return values;
}

/**
 * Preforms a splice operation of the subject array and returns the deleted items
 */
export const spliceBehaviorSubjectAry=<T>(
    subject:BehaviorSubject<T[]>,
    start:number,
    deleteCount:number,
    ...values:T[]
):T[]=>{

    const ary=[...subject.value];

    const deleted=ary.splice(start,deleteCount,...values);

    subject.next(ary);

    return deleted;
}
