import { BehaviorSubject } from "rxjs";
import { DependencyContainer } from "./DependencyContainer";
import { InvalidOverloadCallError } from "./errors";
import { globalDeps } from "./globalDeps";
import { ReadonlySubject } from "./rxjs-types";
import { Setter } from "./Setter";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type TypeRef<T=any>=Readonly<{
    /**
     * A unique symbol used to identify the ref
     */
    refId:symbol;

    /**
     * An optional type that can be used to filter the ref
     */
    type?:string;

    /**
     * Required tracking generic type
     */
    _?:T;
}>;

export const isTypeRef=(value:any): value is TypeRef=>(
    typeof (value as Partial<TypeRef>)?.refId === 'symbol'
);

export const getTypeRefId=(idOrRef:TypeRef|symbol):symbol=>(
    typeof idOrRef === 'symbol'?idOrRef:idOrRef.refId
);

export const createTypeRef=<T>(name:string,type?:string):TypeRef<T>=>Object.freeze({refId:Symbol(name),type});

export interface ServiceRefFunc<T>
{
    (deps?:DependencyContainer):T;
    typeRef:TypeRef<T>;
}

interface createServiceRefOverloads
{
    <T>(name:string,create:(deps:DependencyContainer)=>T):ServiceRefFunc<T>;
    <T>(name:string,type:string,create:(deps:DependencyContainer)=>T):ServiceRefFunc<T>;
}

export const createServiceRef:createServiceRefOverloads=<T>(
    name:string,
    createOrType:string|((deps:DependencyContainer)=>T),
    _create?:(deps:DependencyContainer)=>T):ServiceRefFunc<T>=>
{
    let type:string|undefined;
    let create:(deps:DependencyContainer)=>T;
    if(typeof createOrType === 'string'){
        type=createOrType;
        if(!_create){
            throw new InvalidOverloadCallError(`createServiceRef. name = ${name}`);
        }
        create=_create;
    }else{
        type=undefined;
        create=createOrType;
    }
    const typeRef=createTypeRef<T>(name,type);
    const func=(deps:DependencyContainer=globalDeps)=>deps.getOrRegisterValue(typeRef,create);
    func.typeRef=typeRef;
    return func;
}


export interface SubjectRefFunc<T>
{
    (deps?:DependencyContainer):T;
    typeRef:TypeRef<BehaviorSubject<T>>;
    subject(deps?:DependencyContainer):BehaviorSubject<T>;
}
interface createSubjectRefOverloads
{
    <T>(name:string,defaultValue:T):SubjectRefFunc<T>;
    <T>(name:string,type:string,defaultValue:T):SubjectRefFunc<T>
}
export const createSubjectRef:createSubjectRefOverloads=<T>(name:string,typeOrDefault:string|T,_defaultValue?:T):SubjectRefFunc<T>=>
{
    let type:string|undefined;
    let defaultValue:T;
    if(_defaultValue===undefined){
        defaultValue=typeOrDefault as T;
        type=undefined;
    }else{
        defaultValue=_defaultValue;
        type=typeOrDefault as string;
    }
    const typeRef=createTypeRef<BehaviorSubject<T>>(name,type);
    const getOrCreate=(deps:DependencyContainer=globalDeps)=>deps.getOrRegisterValue(typeRef,()=>new BehaviorSubject<T>(defaultValue));
    const func=(deps:DependencyContainer=globalDeps)=>getOrCreate(deps).value;
    func.typeRef=typeRef;
    func.subject=(deps:DependencyContainer=globalDeps)=>getOrCreate(deps);
    return func;
}


export interface ReadonlySubjectRefFunc<T>
{
    (deps?:DependencyContainer):T;
    typeRef:TypeRef<ReadonlySubject<T>>;
    subject(deps?:DependencyContainer):ReadonlySubject<T>;
}
interface createReadonlySubjectRefOverloads
{
    <T>(name:string,defaultValue:T,setter:Setter<T>):ReadonlySubjectRefFunc<T>;
    <T>(name:string,type:string,defaultValue:T,setter:Setter<T>):ReadonlySubjectRefFunc<T>;
}
export const createReadonlySubjectRef:createReadonlySubjectRefOverloads=<T>(
    name:string,arg2:any,arg3:any,arg4?:any):ReadonlySubjectRefFunc<T>=>
{
    let type:string|undefined;
    let defaultValue:T;
    let setter:Setter<T>;
    if(arg4===undefined){
        type=undefined;
        defaultValue=arg2;
        setter=arg3;
    }else{
        type=arg2;
        defaultValue=arg3;
        setter=arg4;
    }

    const func=type?createSubjectRef<T>(name,type,defaultValue):createSubjectRef<T>(name,defaultValue);

    setter.subject.subscribe(r=>func.subject(r.deps).next(r.value))

    return func;
}
