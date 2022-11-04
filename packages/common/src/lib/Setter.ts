import { Subject } from "rxjs";
import { Scope } from "./scope-types";

const isSetterFlag=Symbol('isSetterFlag');
const isScopedSetterFlag=Symbol('isSetterFlag');

export interface SetterValue<T>
{
    readonly scope:Scope;
    readonly value:T;
}

export interface Setter<T>
{
    (scope:Scope,value:T):void;
    readonly subject:Subject<SetterValue<T>>;
}

export interface ScopedSetter<T>
{
    (value:T):void;
    readonly subject:Subject<SetterValue<T>>;
    readonly scope:Scope;
    readonly setter:Setter<T>;
}

export const createSetter=<T>():Setter<T>=>{
    const subject=new Subject<SetterValue<T>>();
    const setter=(scope:Scope,value:T)=>{
        subject.next({scope,value});
    }
    (setter as any)[isSetterFlag]=true;
    setter.subject=subject;
    return setter;
}

export const createScopedSetter=<T>(scope:Scope,setter:Setter<T>=createSetter()):ScopedSetter<T>=>{
    const scopedSetter=(value:T)=>{
        setter(scope,value);
    }
    scopedSetter.subject=setter.subject;
    scopedSetter.scope=scope;
    scopedSetter.setter=setter;
    (scopedSetter as any)[isScopedSetterFlag]=true;
    return scopedSetter;
}

export const isSetter=(value:any):value is Setter<any>=>(value && value[isSetterFlag])?true:false;

export const isScopedSetter=(value:any):value is ScopedSetter<any>=>(value && value[isScopedSetterFlag])?true:false;

export const isSetterOrScopedSetter=(value:any):value is (ScopedSetter<any>|Setter<any>)=>(value && (value[isSetterFlag]||value[isScopedSetterFlag]))?true:false;
