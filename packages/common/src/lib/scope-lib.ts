import { BehaviorSubject } from "rxjs";
import { asArray } from "./array";
import { CancelToken } from "./CancelToken";
import { continueFunction, FunctionLoopControl, parseConfigBool, shouldBreakFunction } from "./common-lib";
import { HashMap, SymHashMap } from "./common-types";
import { ScopeInitedError, TypeProviderNotFoundError } from "./errors";
import { createPromiseSource, PromiseSource } from "./PromiseSource";
import { CallableTypeDef, FluentProviderType, FluentTypeProvider, ObservableTypeDef, ParamProvider, ReadonlyObservableTypeDef, Scope, ScopeModule, ScopeModuleLifecycle, ScopeRegistration, TypeDef, TypeProvider, TypeProviderOptions } from "./scope-types";
import { createScopedSetter, isScopedSetter, isSetterOrScopedSetter, ScopedSetter, Setter } from "./Setter";
import { ScopeDefineType, TypeDefDefaultValue, TypeDefStaticValue } from "./_internal.common";

interface TypeProviderInternal
{
    readonly type:TypeDef<any>;
    readonly provider:TypeProvider<any>;
    readonly tags:string[];
}

const isTypeDefSymbol=Symbol('isTypeDefSymbol');

export const isTypeDef=(value:any):value is TypeDef<any>=>(value && value[isTypeDefSymbol])?true:false;

let rootPromiseSource:PromiseSource<void>|null=null;
let rootInitScopeOptions:InitScopeOptions|null=null;

interface DefineTypeOptions<T>
{
    name:string;
    defaultValue?:T;
    defaultStaticValue?:T;
    valueConverter?:(str:string)=>T;
    id?:symbol;
    defaultProvider?:TypeProvider<T>|TypeProviderOptions<T>;
    createSubject?:boolean;
    subjectDefault?:TypeProvider<T>;
    subjectSetter?:Setter<T>|ScopedSetter<T>;
}

interface ScopeInternal
{
    [ScopeDefineType]<T>(options:DefineTypeOptions<T>):TypeDef<T>;
    [isTypeDefSymbol]:boolean;
}

export const createScope=(rootModule?:ScopeModule, cancel:CancelToken=new CancelToken(), parent?:Scope):Scope=>
{


    const initPromiseSource=createPromiseSource<void>();
    const isRoot=!rootPromiseSource;
    if(isRoot){
        rootPromiseSource=initPromiseSource;
    }

    let isInited=false;
    initPromiseSource.promise.then(()=>isInited=true);

    const providerMap:SymHashMap<TypeProviderInternal[]>={};

    const types:SymHashMap<TypeDef<any>>={};

    const self=<T>(typeOrSetter:TypeDef<T>|Setter<T>|ScopedSetter<T>,tag?:string):T|ScopedSetter<T>=>{
        if(isSetterOrScopedSetter(typeOrSetter)){
            if(isScopedSetter(typeOrSetter)){
                return createScopedSetter(scope,typeOrSetter.setter);
            }else{
                return createScopedSetter(scope,typeOrSetter);
            }
        }else{
            return require(typeOrSetter as TypeDef<T>,tag);
        }
    }

    const require=<T>(type:TypeDef<T>,tag?:string):T=>
    {
        const value=get(type,tag);
        if(value===undefined){
            if((type as ObservableTypeDef<T>).subject){
                return undefined as T;
            }
            throw new TypeProviderNotFoundError(`type = ${type.typeName}`)
        }
        return value;
    }


    const getProviderValue=(provider:TypeProviderInternal|undefined):any=>provider?.provider(scope);

    const getProvider=(type:TypeDef<any>,tag?:string):TypeProviderInternal|undefined=>
    {
        const providers=providerMap[type.id];
        if(tag){
            if(!providers){
                return undefined;
            }
            for(const p of providers){
                if(p.tags.includes(tag)){
                    return p;
                }
            }
            return undefined;
        }else{
            return providers?providers[providers.length-1]:undefined;
        }
    }

    const getParam=(name:string,defaultValue?:string):string|undefined=>{
        const providers=providerMap[vp.id];
        if(!providers){
            return undefined;
        }
        for(const p of providers){
            const valueP:ParamProvider|HashMap<string>=getProviderValue(p);
            if(typeof valueP.getParam === 'function'){
                const value=valueP.getParam(name);
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
        return parent?.getParam(name)??defaultValue;
    }

    const requireParam=(name:string):string=>{
        const value=getParam(name);
        if(value===undefined){
            throw new Error(`Unable to get provided param value - ${name}`)
        }
        return value;
    }

    const subject=<T>(type:ObservableTypeDef<T>|ReadonlyObservableTypeDef<T>):BehaviorSubject<T>=>{
        if(type.scope!==scope){
            return subject(to(type));
        }
        return type.subject as BehaviorSubject<T>;
    }

    const getType=(id:symbol):TypeDef<any>|undefined=>types[id];

    const get=<T>(type:TypeDef<T>,tag?:string):T|undefined=>{

        if(type.scope!==scope){
            return get(to(type));
        }

        const staticValue=type[TypeDefStaticValue];

        if(staticValue!==undefined){
            return staticValue;
        }

        if(type.valueConverter){
            const provided=getParam(type.typeName);
            if(provided!==undefined){
                return type[TypeDefStaticValue]=type.valueConverter(provided);
            }
            return type[TypeDefDefaultValue];
        }

        let value=getProviderValue(getProvider(type,tag));

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
                const value=getProviderValue(p);
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

    const forEach=<T>(typeRef:TypeDef<T>,tag:string|null|undefined,callback:(value:T,scope:Scope)=>void|boolean|FunctionLoopControl):void=>
    {
        const providers=providerMap[typeRef.id];
        if(!providers){
            return;
        }
        for(const p of providers){
            if(tag && !p.tags.includes(tag)){
                continue;
            }
            if(shouldBreakFunction(callback(getProviderValue(p),scope))){
                break;
            }
        }
    }

    const forEachAsync=async <T>(typeRef:TypeDef<T>,tag:string|null|undefined,callback:(value:T,scope:Scope)=>Promise<void|boolean|FunctionLoopControl>):Promise<void>=>
    {
        const providers=providerMap[typeRef.id];
        if(!providers){
            return;
        }
        for(const p of providers){
            if(tag && !p.tags.includes(tag)){
                continue;
            }
            if(shouldBreakFunction(await callback(getProviderValue(p),scope))){
                break;
            }
        }
    }

    const getFirst=<T,TValue>(typeRef:TypeDef<T>,tag:string|null|undefined,callback:(value:T,scope:Scope)=>TValue|false|FunctionLoopControl):TValue|undefined=>
    {
        const providers=providerMap[typeRef.id];
        if(!providers){
            return undefined;
        }
        for(const p of providers){
            if(tag && !p.tags.includes(tag)){
                continue;
            }
            const value=callback(getProviderValue(p),scope);
            if(shouldBreakFunction(value)){
                break;
            }
            if(value!==false && value!==continueFunction){
                return value as TValue;
            }
        }
        return undefined;
    }

    const getFirstAsync=async <T,TValue>(typeRef:TypeDef<T>,tag:string|null|undefined,callback:(value:T,scope:Scope)=>Promise<TValue|false|FunctionLoopControl>):Promise<TValue|undefined>=>
    {
        const providers=providerMap[typeRef.id];
        if(!providers){
            return undefined;
        }
        for(const p of providers){
            if(tag && !p.tags.includes(tag)){
                continue;
            }
            const value=await callback(getProviderValue(p),scope);
            if(shouldBreakFunction(value)){
                break;
            }
            if(value!==false && value!==continueFunction){
                return value as TValue;
            }
        }
        return undefined;
    }

    const to=<T,D extends TypeDef<T>>(type:D):D=>type.clone(scope) as D;

    const map=<T extends TypeDef<any>[]>(...types:T):T=>{
        const mapped:TypeDef<any>[]=[];

        for(const type of types){
            mapped.push(to(type))
        }

        return mapped as T;
    }

    const _defineType=<T>({
        name,
        defaultValue,
        id=Symbol(),
        valueConverter,
        defaultProvider,
        createSubject,
        subjectDefault,
        subjectSetter
    }:DefineTypeOptions<T>):CallableTypeDef<T>=>{
        if(types[id]){
            return types[id] as CallableTypeDef<T>;
        }
        const typeSelf=(tag?:string)=>require(typeDef,tag);
        typeSelf.clone=(scope:Scope):TypeDef<T>=>(
            (scope as unknown as ScopeInternal)[ScopeDefineType]({
                name,
                defaultValue,
                valueConverter,
                id,
                defaultProvider,
                createSubject,
                subjectDefault,
                subjectSetter
            })
        )
        typeSelf.id=id;
        typeSelf.typeName=name;
        typeSelf.scope=scope;
        typeSelf.get=(tag?:string)=>get(typeDef,tag);
        typeSelf.all=(tag?:string)=>getAll(typeDef,tag);
        typeSelf.forEach=(tag:string|null|undefined,callback:(value:T,scope:Scope)=>void|boolean|FunctionLoopControl)=>scope.forEach<T>(typeDef,tag,callback);
        typeSelf.forEachAsync=(tag:string|null|undefined,callback:(value:T,scope:Scope)=>Promise<void|boolean|FunctionLoopControl>)=>scope.forEachAsync<T>(typeDef,tag,callback);
        typeSelf.getFirstAsync=<TValue>(tag:string|null|undefined,callback:(value:T,scope:Scope)=>Promise<TValue|false|FunctionLoopControl>)=>scope.getFirstAsync<T,TValue>(typeDef,tag,callback);
        typeSelf.getFirst=<TValue>(tag:string|null|undefined,callback:(value:T,scope:Scope)=>TValue|false|FunctionLoopControl)=>scope.getFirst<T,TValue>(typeDef,tag,callback);
        typeSelf.require=(tag?:string)=>require(typeDef,tag);
        typeSelf.valueConverter=valueConverter;
        if(defaultValue!==undefined){
            (typeSelf as any)[TypeDefDefaultValue]=defaultValue;
        }
        const typeDef:CallableTypeDef<T>=typeSelf;
        types[id]=typeSelf;
        if(defaultProvider){
            provideForType(typeDef,defaultProvider);
        }
        if(createSubject){
            const subject=new BehaviorSubject<T>(subjectDefault?.(scope) as any);
            typeSelf.subject=subject;
            subject.subscribe(v=>(typeSelf as TypeDef<T>)[TypeDefStaticValue]=v);
            if(subjectSetter){
                subjectSetter.subject.subscribe(v=>{
                    if(v.scope===scope){
                        subject.next(v.value)
                    }
                });
            }
            (typeSelf as TypeDef<T>)[TypeDefStaticValue]=subjectDefault?.(scope);
        }
        return typeDef;
    }

    const defineType=<T>(name:string,defaultProvider?:TypeProvider<T>|TypeProviderOptions<T>):CallableTypeDef<T>=>(
        _defineType<T>({name,defaultProvider})
    )

    const defineObservable=<T>(name:string,defaultValue?:TypeProvider<T>):ObservableTypeDef<T>=>
    (
        _defineType({
            name,
            createSubject:true,
            subjectDefault:defaultValue,
        }) as ObservableTypeDef<T>
    )

    const defineReadonlyObservable=<T>(name:string,setter:Setter<T>|ScopedSetter<T>,defaultValue?:TypeProvider<T>):ReadonlyObservableTypeDef<T>=>
    (
        _defineType({
            name,
            createSubject:true,
            subjectDefault:defaultValue,
            subjectSetter:setter,
        }) as ReadonlyObservableTypeDef<T>
    )

    const provideParams=(valueProvider:ParamProvider|HashMap<string>):void=>
    {
        provideForType(vp,()=>valueProvider);
    }

    const defineParam=<T>(name:string,valueConverter?:(str:string,scope:Scope)=>T,defaultValue?:T):CallableTypeDef<T>=>
    (
        _defineType<T>({
            name,
            defaultValue,
            valueConverter:valueConverter?str=>valueConverter(str,scope):(str=>JSON.parse(str))
        })
    )

    const defineStringParam=(name:string,defaultValue?:string):CallableTypeDef<string>=>_defineType<string>({name,defaultValue,valueConverter:str=>str});

    const defineNumberParam=(name:string,defaultValue?:number):CallableTypeDef<number>=>_defineType<number>({name,defaultValue,valueConverter:str=>Number(str)});

    const defineBoolParam=(name:string,defaultValue?:boolean):CallableTypeDef<boolean>=>_defineType<boolean>({name,defaultValue,valueConverter:parseConfigBool});



    const provideForType=<T,P extends T>(
        type:TypeDef<T>,
        provider:TypeProvider<P>|TypeProviderOptions<P>,
        tags:string|string[]=[]
    ):FluentTypeProvider<P>=>{

        if(isInited){
            throw new ScopeInitedError(
                'Can not provide type implementations or params after a scope is initialized')
        }

        let providers=providerMap[type.id];
        if(!providers){
            providers=[];
            providerMap[type.id]=providers;
        }

        let cached:T|undefined=undefined;
        let sourceProvider:TypeProvider<P>;
        let isFactory:boolean;
        tags=[...asArray(tags)]

        if(typeof provider === 'function'){
            sourceProvider=provider;
            isFactory=false;
        }else{
            sourceProvider=provider.provider;
            isFactory=provider.isFactory??false;
            if(provider.tags){
                for(const t of provider.tags){
                    tags.push(t);
                }
            }
            if(provider.tag){
                tags.push(provider.tag);
            }
        }
        const _provider:TypeProvider<T>=(scope)=>{
            if(isFactory){
                return sourceProvider(scope);
            }
            if(cached!==undefined){
                return cached;
            }
            cached=sourceProvider(scope);
            return cached;
        }

        providers.push({
            type,
            provider:_provider,
            tags,
        })

        const fluent:FluentTypeProvider<P>={
            andFor<T>(
                type:TypeDef<FluentProviderType<T,P>>,
                tags:string|string[]=[]
            ):FluentTypeProvider<P>{

                tags=asArray(tags);

                let providers=providerMap[type.id];
                if(!providers){
                    providers=[];
                    providerMap[type.id]=providers;
                }
                providers.push({
                    type,
                    provider:_provider,
                    tags,
                })

                return fluent;
            },
            getValue(){
                return _provider(scope) as P
            }
        }
        return fluent;
    }


    const createChild=(appendModule?:ScopeModule):Scope=>createScope((reg)=>{
        if(rootModule){
            reg.use(rootModule);
        }
        if(appendModule){
            reg.use(appendModule);
        }
    },cancel,parent);

    const recreate=(appendModule?:ScopeModule,cancel:CancelToken=new CancelToken()):Scope=>createScope((reg)=>{
        if(rootModule){
            reg.use(rootModule);
        }
        if(appendModule){
            reg.use(appendModule);
        }
    },cancel);


    self.require=require;
    self.get=get;
    self.getType=getType;
    self.getAll=getAll;
    self.forEach=forEach;
    self.forEachAsync=forEachAsync;
    self.getFirstAsync=getFirstAsync;
    self.getFirst=getFirst;
    self.subject=subject;
    self.to=to;
    self.map=map;
    self.defineType=defineType;
    self.defineService=defineType;
    self.defineObservable=defineObservable as any;
    self.defineReadonlyObservable=defineReadonlyObservable as any;
    self.getParam=getParam as any;
    self.requireParam=requireParam;
    self.defineParam=defineParam;
    self.defineStringParam=defineStringParam;
    self.defineNumberParam=defineNumberParam;
    self.defineBoolParam=defineBoolParam;
    self.createChild=createChild;
    self.recreate=recreate;
    self.parent=parent;
    self.isInited=()=>isInited;

    self.initPromise=initPromiseSource.promise;

    (self as unknown as ScopeInternal)[ScopeDefineType]=_defineType;
    (self as unknown as ScopeInternal)[isTypeDefSymbol]=true;

    const scope:Scope=self;

    const initOptions:InitScopeOptions={
        scope,
        cancel,
        provideForType,
        provideParams,
        rootModule
    }
    if(isRoot){
        rootInitScopeOptions=initOptions;
    }else if(rootModule){
        initScopeAsync(initOptions)
            .then(()=>initPromiseSource.resolve())
            .catch(r=>initPromiseSource.reject(r));
    }else{
        initPromiseSource.resolve();
    }

    return scope;
}

interface InitScopeOptions
{
    scope:Scope;
    cancel:CancelToken;
    provideParams(valueProvider:ParamProvider|HashMap<string>):void;
    provideForType<T,P extends T>(
        type:TypeDef<T>,
        provider:TypeProvider<P>|TypeProviderOptions<P>,
        tags?:string|string[]
    ):FluentTypeProvider<P>;
    rootModule?:ScopeModule;
}

const initScopeAsync=async ({
    scope,
    cancel,
    provideForType,
    provideParams,
    rootModule
}:InitScopeOptions)=>{

    if(!rootModule){
        return;
    }

    const disposeList:((scope:Scope)=>void)[]=[];
    const disposeModules=()=>{
        while(disposeList.length){
            try{
                disposeList.shift()?.(scope);
            }catch(ex){
                console.warn('Dispose module failed',ex);
            }
        }
    }
    cancel.onCancelOrNextTick(disposeModules)
    try{
        const lifecycles:ScopeModuleLifecycle[]=[];
        const reg:ScopeRegistration={
            scope,
            cancel,
            provideParams,
            provideForType,
            provideForService:provideForType,
            use(module:ScopeModule){
                const lifecycle=module(reg);
                if(lifecycle){
                    lifecycles.push(lifecycle);
                }

            }
        }
        reg.use(rootModule);
        lifecycles.sort((a,b)=>(b.priority??0)-(a.priority??0));

        let initPromises:Promise<void>[]=[];

        let lastPriority=lifecycles[0]?.priority??0;
        for(const lc of lifecycles){

            if((lastPriority!==lc.priority??0) && initPromises.length){
                await Promise.all(initPromises);
                cancel.throwIfCanceled();
                lastPriority=lc.priority??0;
                initPromises=[];
            }

            cancel.throwIfCanceled();
            if(lc.dispose){
                disposeList.push(lc.dispose);
            }
            const init=lc.init?.(scope,cancel);
            if(init){
                initPromises.push(init);
            }
        }

        await Promise.all(initPromises);
        cancel.throwIfCanceled();

        for(const lc of lifecycles){
            lc.onAllInited?.(scope);
        }

    }catch(ex){
        console.error('Scope initialization failed',ex);
        disposeModules();
    }
}

const rootCancel=new CancelToken();
export const rootScope=createScope(undefined,rootCancel);
const vp=rootScope.defineType<ParamProvider|HashMap<string>>('vp');

export const initRootScope=(rootModule?:ScopeModule)=>{
    if(!rootInitScopeOptions || !rootPromiseSource){
        throw new Error(
            'Root scope not properly created. rootInitScopeOptions or rootPromiseSource not set');
    }
    if(rootInitScopeOptions && rootModule){
        initScopeAsync(rootInitScopeOptions)
            .then(()=>rootPromiseSource?.resolve())
            .catch(r=>rootPromiseSource?.reject(r));
    }else{
        rootPromiseSource?.resolve();
    }
}

export const defineType=<T>(
    name:string,
    defaultProvider?:TypeProvider<T>|TypeProviderOptions<T>)
    :TypeDef<T>=>rootScope.defineType<T>(name,defaultProvider);

export const defineService=<T>(
    name:string,
    defaultProvider?:TypeProvider<T>|TypeProviderOptions<T>)
    :CallableTypeDef<T>=>rootScope.defineService<T>(name,defaultProvider);

interface defineObservableOverloads
{
    <T>(name:string,defaultValue:TypeProvider<T>):ObservableTypeDef<T>;
    <T>(name:string):ObservableTypeDef<T|undefined>;
}
export const defineObservable=(<T>(name:string,defaultValue:TypeProvider<T>):ObservableTypeDef<T>=>(
    rootScope.defineObservable(name,defaultValue)
)) as defineObservableOverloads;

interface defineReadonlyObservableOverloads
{
    <T>(name:string,setter:Setter<T>|ScopedSetter<T>,defaultValue:TypeProvider<T>):ReadonlyObservableTypeDef<T>;
    <T>(name:string,setter:Setter<T>|ScopedSetter<T>):ReadonlyObservableTypeDef<T|undefined>;
}
export const defineReadonlyObservable=(<T>(name:string,setter:Setter<T>|ScopedSetter<T>,defaultValue:TypeProvider<T>):ReadonlyObservableTypeDef<T>=>(
    rootScope.defineReadonlyObservable(name,setter,defaultValue)
)) as defineReadonlyObservableOverloads;

export const defineParam=<T>(name:string,valueConverter?:(str:string,scope:Scope)=>T,defaultValue?:T):CallableTypeDef<T>=>(
    rootScope.defineParam(name,valueConverter,defaultValue)
)

export const defineStringParam=(name:string,defaultValue?:string):CallableTypeDef<string>=>(
    rootScope.defineStringParam(name,defaultValue)
)

export const defineNumberParam=(name:string,defaultValue?:number):CallableTypeDef<number>=>(
    rootScope.defineNumberParam(name,defaultValue)
)

export const defineBoolParam=(name:string,defaultValue?:boolean):CallableTypeDef<boolean>=>(
    rootScope.defineBoolParam(name,defaultValue)
)

interface getParamOverloads
{
    (name:string):string|undefined;
    (name:string,defaultValue:string):string;
}
export const getParam=((name:string,defaultValue?:string):string|undefined=>(
    rootScope.getParam(name,defaultValue as any)
)) as getParamOverloads;

export const requireParam=(name:string)=>rootScope.requireParam(name);

export class EnvValueProvider implements ParamProvider
{

    public readonly autoPrefix?:string;

    public constructor(autoPrefix='NX_')
    {
        this.autoPrefix=autoPrefix;
    }

    public getParam(name:string):string|undefined{
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
