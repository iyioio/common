// This file contains stub interfaces with then minimum set of members for use by the @iyio/common library.
// Stubs are used to prevent having a direct dependency on RxJs.

export interface RxJsUnsubscribable {
  unsubscribe():void;
}

export interface RxJsSubscriptionLike extends RxJsUnsubscribable {
  unsubscribe():void;
  readonly closed:boolean;
}

export interface RxJsBehaviorSubject<T> extends RxJsSubject<T> {

    get value():T;

    getValue():T;

    next(value:T):void;
}

export interface RxJsObserver<T> {
  next:(value:T)=>void;
  error:(err:any)=>void;
  complete:()=>void;
}

export interface RxJsSubject<T> extends RxJsObservable<T>, RxJsSubscriptionLike {

}

export interface RxJsObservable<T> {
    subscribe(next:(value:T)=>void):RxJsSubscription;
}

export interface RxJsSubscription extends RxJsSubscriptionLike {
    unsubscribe():void;
}
