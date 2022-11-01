import { FunctionLoopControl, shouldBreakFunction } from "./common-lib";
import { SymStrHashMap } from "./common-types";
import { DependencyNotFoundError } from "./errors";
import { getTypeRefId, isTypeRef, TypeRef } from "./TypeRef";
import { uuid } from "./uuid";

export type DependencyLifetime='transient'|'singleton';//'scoped'

export interface Dependency<T=any>
{
    readonly id:symbol;
    readonly type?:string;
    readonly lifetime:DependencyLifetime;
    readonly create?:(deps:DependencyContainer)=>T;
    value?:T;
    readonly metadata?:SymStrHashMap;
}
export const getDependencyValue=<T>(dep:Dependency<T>, container:DependencyContainer):T=>{
    if(dep.value!==undefined){
        return dep.value;
    }
    if(dep.create!==undefined){
        const value=dep.create(container);
        if(dep.lifetime==='singleton'){
            dep.value=value;
        }
        return value;
    }
    throw new Error('Invalid Dependency object. value or create must be defined.');
}

export interface DependencyInstance<T>
{
    id:symbol;
    lifetime:DependencyLifetime;
    instance:T;
}

export class DependencyContainer
{

    public readonly id:string=uuid();

    private _count=0;
    public get count(){return this._count}

    private readonly deps:{[id:symbol]:Dependency[]}={};

    public require<T>(typeRef:symbol|TypeRef<T>):T
    {
        const value=this.get<T>(getTypeRefId(typeRef));
        if(value===undefined){
            throw new DependencyNotFoundError(`typeRef = ${String(typeRef)}`);
        }
        return value;
    }

    public requireDependency<T>(typeRef:symbol|TypeRef<T>):Dependency<T>
    {
        const dep=this.getDependency(typeRef);
        if(dep===undefined){
            throw new DependencyNotFoundError(`typeRef = ${String(typeRef)}`);
        }
        return dep;
    }

    /**
     * Returns all dependency values matching the ref
     */
    public getAll<T>(typeRef:symbol|TypeRef<T>,type?:string):T[]
    {

        if(isTypeRef(typeRef)){
            typeRef=typeRef.refId;
        }

        const all:T[]=[];
        const ary=this.deps[typeRef];
        if(!ary){
            return all;
        }
        for(const dep of ary){
            if(type && dep.type && dep.type!==type){
                continue;
            }
            all.push(getDependencyValue(dep,this));
        }
        return all;

    }

    public forEach<T>(typeRef:symbol|TypeRef<T>,type:string|null|undefined,callback:(value:T)=>void|boolean|FunctionLoopControl):void
    {

        if(isTypeRef(typeRef)){
            typeRef=typeRef.refId;
        }

        const ary=this.deps[typeRef];
        if(!ary){
            return;
        }
        for(const dep of ary){
            if(type && dep.type && dep.type!==type){
                continue;
            }
            const value=getDependencyValue(dep,this);
            if(shouldBreakFunction(callback(value))){
                return;
            }
        }
    }

    public async forEachAsync<T>(typeRef:symbol|TypeRef<T>,type:string|null|undefined,callback:(value:T)=>Promise<void|boolean|FunctionLoopControl>):Promise<void>
    {

        if(isTypeRef(typeRef)){
            typeRef=typeRef.refId;
        }

        const ary=this.deps[typeRef];
        if(!ary){
            return;
        }
        for(const dep of ary){
            if(type && dep.type && dep.type!==type){
                continue;
            }
            const value=getDependencyValue(dep,this);
            if(shouldBreakFunction(await callback(value))){
                return;
            }
        }
    }

    public async getFirstAsync<T,TValue>(typeRef:symbol|TypeRef<T>,type:string|null|undefined,callback:(value:T)=>Promise<TValue|false|FunctionLoopControl>):Promise<TValue|undefined>
    {

        if(isTypeRef(typeRef)){
            typeRef=typeRef.refId;
        }

        const ary=this.deps[typeRef];
        if(!ary){
            return undefined;
        }
        for(const dep of ary){
            if(type && dep.type && dep.type!==type){
                continue;
            }
            const value=getDependencyValue(dep,this);
            const callbackValue=await callback(value);
            if(shouldBreakFunction(callbackValue)){
                return undefined;
            }
            if(callbackValue!==undefined){
                return callbackValue as any;
            }
        }
        return undefined;
    }

    public getFirst<T,TValue>(typeRef:symbol|TypeRef<T>,type:string|null|undefined,callback:(value:T)=>TValue|false|FunctionLoopControl):TValue|undefined
    {

        if(isTypeRef(typeRef)){
            typeRef=typeRef.refId;
        }

        const ary=this.deps[typeRef];
        if(!ary){
            return undefined;
        }
        for(const dep of ary){
            if(type && dep.type && dep.type!==type){
                continue;
            }
            const value=getDependencyValue(dep,this);
            const callbackValue=callback(value);
            if(shouldBreakFunction(callbackValue)){
                return undefined;
            }
            if(callbackValue!==undefined){
                return callbackValue as any;
            }
        }
        return undefined;
    }

    /**
     * Returns all dependency values matching the ref
     */
    public getAllDependencies<T>(typeRef:symbol|TypeRef<T>):Dependency<T>[]
    {
        if(isTypeRef(typeRef)){
            typeRef=typeRef.refId;
        }
        const ary=this.deps[typeRef];
        return ary?[...ary]:[];

    }

    public get<T>(typeRef:symbol|TypeRef<T>):T|undefined
    {
        const dep=this.getDependency(typeRef);
        return dep?getDependencyValue(dep,this):undefined;
    }

    public getDependency<T>(typeRef:symbol|TypeRef<T>):Dependency<T>|undefined
    {

        if(isTypeRef(typeRef)){
            typeRef=typeRef.refId;
        }

        return (this.deps[typeRef] as Dependency<T>[]|undefined)?.[0];
    }

    public getDependencyValue<T>(dep:Dependency<T>):T
    {
        return getDependencyValue(dep,this);
    }

    public getOrRegisterValue<T>(typeRef:symbol|TypeRef<T>,create:(deps:DependencyContainer)=>T):T
    {
        let dep=this.getDependency(typeRef);
        if(!dep){
            dep=this.registerValue(typeRef,create(this));
        }
        return getDependencyValue(dep,this);
    }



    public register<T>(dep:Dependency<T>):Dependency<T>
    {
        let ary=this.deps[dep.id];
        if(!ary){
            ary=[];
            this.deps[dep.id]=ary;
        }
        ary.push(dep);
        this._count++;
        return dep;
    }

    public registerSingleton<T>(typeRef:symbol|TypeRef<T>,create:(deps:DependencyContainer)=>T){
        return this.register<T>({
            id:getTypeRefId(typeRef),
            type:typeof typeRef === 'object'?typeRef.type:undefined,
            lifetime:'singleton',
            create
        });
    }

    /**
     * Registers a value as a singleton
     */
    public registerValue<T>(typeRef:symbol|TypeRef<T>,value:T){
        return this.register<T>({
            id:getTypeRefId(typeRef),
            type:typeof typeRef === 'object'?typeRef.type:undefined,
            lifetime:'singleton',
            value
        });
    }

    public registerTransient<T>(typeRef:symbol|TypeRef<T>,create:(deps:DependencyContainer)=>T)
    {
        return this.register<T>({
            id:getTypeRefId(typeRef),
            type:typeof typeRef === 'object'?typeRef.type:undefined,
            lifetime:'transient',
            create
        });
    }

    // public registerScoped<T>(name:string,create:(deps:DependencyContainer)=>T)
    // {
    //     this.register<T>({
    //         name,
    //         lifetime:'scoped',
    //         create
    //     });
    // }
}
