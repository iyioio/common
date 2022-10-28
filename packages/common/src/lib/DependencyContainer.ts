import { getTypeRefId, isTypeRef, TypeRef } from "./TypeRef";

export type DependencyLifetime='transient'|'singleton';//'scoped'

export interface Dependency<T=any>
{
    id:symbol;
    lifetime:DependencyLifetime;
    create:(deps:DependencyContainer)=>T;
}

export interface DependencyInstance<T>
{
    id:symbol;
    lifetime:DependencyLifetime;
    instance:T;
}

export class DependencyContainer
{
    private readonly deps:{[id:symbol]:Dependency}={};

    private readonly singletons:{[name:symbol]:any}={};

    public require<T>(typeRef:symbol|TypeRef<T>):T{

        return this.requireInstance<T>(getTypeRefId(typeRef))?.instance;
    }

    public requireInstance<T>(typeRef:symbol|TypeRef<T>):DependencyInstance<T>{
        const inst=this.getInstance<T>(typeRef);
        if(!inst){
            throw new Error(`No dependency found by the id ${String(typeRef)}`);
        }
        return inst;
    }

    public get<T>(typeRef:symbol|TypeRef<T>):T|undefined{

        return this.getInstance<T>(getTypeRefId(typeRef))?.instance;
    }

    public getInstance<T>(typeRef:symbol|TypeRef<T>):DependencyInstance<T>|undefined{

        if(isTypeRef(typeRef)){
            typeRef=typeRef.refId;
        }

        const dep=this.deps[typeRef] as Dependency<T>|undefined;
        if(!dep){
            return undefined;
        }

        switch(dep.lifetime){
            //case 'scoped':
            case 'transient':
                return {
                    id:dep.id,
                    lifetime:dep.lifetime,
                    instance:dep.create(this),
                }

            case 'singleton':{
                let d=this.singletons[typeRef];
                if(!d){
                    d=dep.create(this);
                    this.singletons[typeRef]=d;
                }
                return {
                    id:dep.id,
                    lifetime:dep.lifetime,
                    instance:d,
                }
            }

        }
    }



    public register<T>(dep:Dependency<T>)
    {
        this.deps[dep.id]=dep;
    }

    public registerSingleton<T>(typeRef:symbol|TypeRef<T>,create:(deps:DependencyContainer)=>T){
        this.register<T>({
            id:getTypeRefId(typeRef),
            lifetime:'singleton',
            create
        });
    }

    public registerTransient<T>(typeRef:symbol|TypeRef<T>,create:(deps:DependencyContainer)=>T)
    {
        this.register<T>({
            id:getTypeRefId(typeRef),
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

export const deps=new DependencyContainer();
