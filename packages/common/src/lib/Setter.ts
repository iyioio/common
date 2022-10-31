import { Subject } from "rxjs";
import { DependencyContainer } from "./DependencyContainer";

export interface SetValueRequest<T>
{
    value:T;
    deps:DependencyContainer;
}

export interface Setter<T>
{
    (deps:DependencyContainer,value:T):void;
    readonly subject:Subject<SetValueRequest<T>>
}

export const createSetter=<T>():Setter<T>=>{
    const subject=new Subject<SetValueRequest<T>>();
    const setter=(deps:DependencyContainer,value:T)=>{
        subject.next({value,deps});
    }
    setter.subject=subject;
    return setter;
}

