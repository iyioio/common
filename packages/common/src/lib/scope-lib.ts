import { BehaviorSubject } from "rxjs";
import { asArray } from "./array";
import { HashMap, SymHashMap } from "./common-types";
import { parseConfigBool } from "./config";
import { TypeProviderNotFoundError } from "./errors";
import { ReadonlySubject } from "./rxjs-types";
import { Scope, TypeDef, TypeProvider, TypeProviderOptions, ValueProvider } from "./scope-types";
import { Setter } from "./Setter";
import { TypeDefDefaultValue, TypeDefStaticValue } from "./_internal.common";

interface TypeProviderInternal
{
    readonly type:TypeDef<any>;
    readonly provider:TypeProvider<any>;
    readonly tags:string[];
    readonly isFactory:boolean;
    value?:any;
}

export const createScope=(parent?:Scope):Scope=>
{

    const providerMap:SymHashMap<TypeProviderInternal[]>={};

    const types:SymHashMap={};

    const self=<T>(type:TypeDef<T>):T=>require(type);

    const require=<T>(type:TypeDef<T>):T=>
    {
        const value=get(type);
        if(value===undefined){
            throw new TypeProviderNotFoundError(`type = ${type.typeName}`)
        }
        return value;
    }


    const getValue=(provider:TypeProviderInternal|undefined):any=>
    {
        if(!provider){
            return undefined;
        }
        if(provider.value!==undefined){
            return provider.value;
        }
        const value=provider.provider(scope);
        if(!provider.isFactory){
            provider.value=value;
        }
        return value;
    }

    const getProvider=(type:TypeDef<any>):TypeProviderInternal|undefined=>
    {
        return providerMap[type.id]?.[0];
    }

    const getProvidedValue=(name:string):string|undefined=>{
        const providers=providerMap[vp.id];
        if(!providers){
            return undefined;
        }
        for(const p of providers){
            const valueP:ValueProvider|HashMap<string>=getValue(p);
            if(typeof valueP.getValue === 'function'){
                const value=valueP.getValue(name);
                if(value!==undefined){
                    return value;
                }
            }else if(valueP){
                const value=(valueP as any)[name];
                if(typeof value === 'string'){
                    return value;
                }
            }
        }
        return parent?.getProvidedValue(name);
    }

    const get=<T>(type:TypeDef<T>):T|undefined=>{
        const staticValue=type[TypeDefStaticValue];

        if(staticValue!==undefined){
            return staticValue;
        }

        if(type.valueConverter){
            const provided=getProvidedValue(type.typeName);
            if(provided!==undefined){
                return type[TypeDefStaticValue]=type.valueConverter(provided);
            }
            return type[TypeDefDefaultValue];
        }

        let value=getValue(getProvider(type));

        if(value===undefined){
            if(parent){
                value=parent.get(type);
                if(value!==undefined){
                    return value;
                }
            }
            return type[TypeDefDefaultValue];
        }else{
            return value;
        }
    }
    const getAll=<T>(type:TypeDef<T>,tag?:string):T[]=>
    {
        const values:T[]=[];
        const providers=providerMap[type.id];
        if(providers){
            for(const p of providers){
                if(tag!==undefined && !p.tags.includes(tag)){
                    continue;
                }
                const value=getValue(p);
                if(value!==undefined){
                    values.push(value);
                }
            }
        }
        if(parent){
            const parentValues=parent.getAll<T>(type,tag);
            for(const v of parentValues){
                values.push(v);
            }
        }
        return values;
    }

    const to=<T>(type:TypeDef<T>):TypeDef<T>=>
    {
        const existing=types[type.id];
        if(existing){
            return existing;
        }
        const scopedType=_defineType<T>(type.typeName,type[TypeDefDefaultValue],type.valueConverter,type.id);
        scopedType[TypeDefStaticValue]=type[TypeDefStaticValue];
        return scopedType;
    }

    const map=<T extends TypeDef<any>[]>(...types:T):T=>{
        const mapped:TypeDef<any>[]=[];

        for(const type of types){
            mapped.push(to(type))
        }

        return mapped as T;
    }

    const _defineType=<T>(name:string,defaultValue?:T,valueConverter?:(str:string)=>T,id?:symbol):TypeDef<T>=>
    {
        const type=()=>require(typeDef);
        type.id=id??Symbol(name);
        type.typeName=name;
        type.scope=scope;
        type.get=()=>get(typeDef);
        type.all=(tag?:string)=>getAll(typeDef,tag);
        type.require=type;
        type.valueConverter=valueConverter;
        if(defaultValue!==undefined){
            (type as any)[TypeDefDefaultValue]=defaultValue;
        }
        const typeDef:TypeDef<T>=type;
        types[type.id]=type;
        return typeDef;
    }

    const defineType=<T>(name:string):TypeDef<T>=>_defineType(name);

    const provideType=<T>(type:TypeDef<T>,provider:TypeProvider<T>|TypeProviderOptions<T>,tags:string|string[]=[]):void=>
    {
        let providers=providerMap[type.id];
        if(!providers){
            providers=[];
            providerMap[type.id]=providers;
        }

        tags=[...asArray(tags)]
        if(typeof provider === 'function'){
            providers.push({
                type,
                provider,
                tags,
                isFactory:false,
            })
        }else{
            if(provider.tags){
                for(const t of provider.tags){
                    tags.push(t);
                }
            }
            if(provider.tag){
                tags.push(provider.tag);
            }
            providers.push({
                type,
                provider:provider.provider,
                tags,
                isFactory:provider.isFactory??false,

            })
        }
    }

    const defineObservable=<T>(name:string,defaultValue:T):TypeDef<BehaviorSubject<T>>=>
    {
        const subject=new BehaviorSubject<T>(defaultValue);
        const type=defineType<BehaviorSubject<T>>(name);
        type[TypeDefStaticValue]=subject;
        return type;
    }

    const defineReadonlyObservable=<T>(name:string,setter:Setter<T>,defaultValue:T):TypeDef<ReadonlySubject<T>>=>
    {
        const subject=new BehaviorSubject<T>(defaultValue);
        const type=defineType<ReadonlySubject<T>>(name);
        type[TypeDefStaticValue]=subject;
        setter.subject.subscribe(v=>subject.next(v.value));
        return type;
    }

    const provideValues=(valueProvider:ValueProvider|HashMap<string>):void=>
    {
        provideType(vp,()=>valueProvider);
    }

    const defineValue=<T>(name:string,valueConverter?:(str:string,scope:Scope)=>T,defaultValue?:T):TypeDef<T>=>
    (
        _defineType<T>(name,defaultValue,valueConverter?str=>valueConverter(str,scope):(str=>JSON.parse(str)))
    )

    const defineString=(name:string,defaultValue?:string):TypeDef<string>=>_defineType<string>(name,defaultValue,str=>str);

    const defineNumber=(name:string,defaultValue?:number):TypeDef<number>=>_defineType<number>(name,defaultValue,str=>Number(str));

    const defineBool=(name:string,defaultValue?:boolean):TypeDef<boolean>=>_defineType<boolean>(name,defaultValue,parseConfigBool);


    self.require=require;
    self.get=get;
    self.getAll=getAll;
    self.to=to;
    self.map=map;
    self.defineType=defineType;
    self.provideType=provideType;
    self.defineObservable=defineObservable as any;
    self.defineReadonlyObservable=defineReadonlyObservable as any;
    self.provideValues=provideValues;
    self.getProvidedValue=getProvidedValue;
    self.defineValue=defineValue;
    self.defineString=defineString;
    self.defineNumber=defineNumber;
    self.defineBool=defineBool;
    self.parent=parent;

    const scope:Scope=self;

    return scope;
}

export const rootScope=createScope();
const vp=rootScope.defineType<ValueProvider|HashMap<string>>('vp')

export const defineType=<T>(name:string):TypeDef<T>=>rootScope.defineType<T>(name);

export const provideType=<T>(type:TypeDef<T>,provider:TypeProvider<T>|TypeProviderOptions<T>,tags:string|string[]=[]):void=>(
    rootScope.provideType<T>(type,provider,tags)
);

interface defineObservableOverloads
{
    <T>(name:string,defaultValue:T):TypeDef<BehaviorSubject<T>>;
    <T>(name:string):TypeDef<BehaviorSubject<T|undefined>>;
}
export const defineObservable=(<T>(name:string,defaultValue:T):TypeDef<BehaviorSubject<T>>=>(
    rootScope.defineObservable(name,defaultValue)
)) as defineObservableOverloads;

interface defineReadonlyObservableOverloads
{
    <T>(name:string,setter:Setter<T>,defaultValue:T):TypeDef<ReadonlySubject<T>>;
    <T>(name:string,setter:Setter<T>):TypeDef<ReadonlySubject<T|undefined>>;
}
export const defineReadonlyObservable=(<T>(name:string,setter:Setter<T>,defaultValue:T):TypeDef<ReadonlySubject<T>>=>(
    rootScope.defineReadonlyObservable(name,setter,defaultValue)
)) as defineReadonlyObservableOverloads;

export const provideValues=(valueProvider:ValueProvider|HashMap<string>):void=>(
    rootScope.provideValues(valueProvider)
)

export const defineValue=<T>(name:string,valueConverter?:(str:string,scope:Scope)=>T,defaultValue?:T):TypeDef<T>=>(
    rootScope.defineValue(name,valueConverter,defaultValue)
)

export const defineString=(name:string,defaultValue?:string):TypeDef<string>=>(
    rootScope.defineString(name,defaultValue)
)

export const defineNumber=(name:string,defaultValue?:number):TypeDef<number>=>(
    rootScope.defineNumber(name,defaultValue)
)

export const defineBool=(name:string,defaultValue?:boolean):TypeDef<boolean>=>(
    rootScope.defineBool(name,defaultValue)
)

export class EnvValueProvider implements ValueProvider
{

    public readonly autoPrefix?:string;

    public constructor(autoPrefix='NX_')
    {
        this.autoPrefix=autoPrefix;
    }

    public getValue(name:string):string|undefined{
        const env=(globalThis as any).process?.env;
        const value=env?.[name];
        if(value!==undefined){
            return value;
        }
        if(this.autoPrefix){
            return env?.[this.autoPrefix+name];
        }else{
            return undefined;
        }
    }
}
