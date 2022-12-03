import { BehaviorSubject } from "rxjs/internal/BehaviorSubject";
import { asArray } from "./array";
import { CancelToken } from "./CancelToken";
import { continueFunction, FunctionLoopControl, parseConfigBool, shouldBreakFunction } from "./common-lib";
import { AnyFunction, HashMap, SymHashMap } from "./common-types";
import { ScopeInitedError, TypeProviderNotFoundError } from "./errors";
import { createPromiseSource } from "./PromiseSource";
import { CallableTypeDef, ClientTypeDef, FactoryTypeDef, FluentProviderType, FluentTypeProvider, GeneratorTypeDef, ObservableTypeDef, ParamProvider, ParamTypeDef, ProviderTypeDef, ReadonlyObservableTypeDef, Scope, ScopeModule, ScopeModuleLifecycle, ScopeRegistration, ServiceTypeDef, TypeDef, TypeProvider, TypeProviderOptions } from "./scope-types";
import { createScopedSetter, isScopedSetter, isSetterOrScopedSetter, ScopedSetter, Setter } from "./Setter";
import { ScopeReset, TypeDefDefaultValue, TypeDefStaticValue } from "./_internal.common";

const ScopeDefineType=Symbol('ScopeDefineType');
const ScopeDefineCallableType=Symbol('ScopeDefineCallableType');
const ScopeInit=Symbol('ScopeInit');

export const ScopeModulePriorities={
    _10:10000,
    critical:10000,

    _9:9000,
    high:9000,
    preConfig:9000,

    _8:8000,

    _7:7000,
    mediumHigh:7000,
    config:7000,

    _6:6000,

    _5:5000,
    medium:5000,
    postConfig:5000,

    _4:4000,

    _3:3000,
    lowMedium:3000,
    types:3000,

    _2:2000,

    _1:1000,
    low:1000,
    subTypes:1000,

    _0:0,
    belowLow:0,
    optional:0,

} as const;
Object.freeze(ScopeModulePriorities);

interface TypeProviderInternal
{
    readonly type:TypeDef<any>;
    readonly provider:TypeProvider<any>;
    readonly tags:string[];
}

const isTypeDefSymbol=Symbol('isTypeDefSymbol');

export const isTypeDef=(value:any):value is TypeDef<any>=>(value && value[isTypeDefSymbol])?true:false;


interface ScopeInternal extends Scope
{
    /**
     * Defines a new type
     */
    defineType<T>(name:string,defaultProvider?:TypeProvider<T>|TypeProviderOptions<T>):TypeDef<T>;

    /**
     * Defines a new type
     */
    defineGeneratorType<T extends AnyFunction>(name:string,defaultFactory?:T):GeneratorTypeDef<T>;

    /**
     * Defines a new type
     */
    defineCallableType<T>(name:string,defaultProvider?:TypeProvider<T>|TypeProviderOptions<T>):CallableTypeDef<T>;

    /**
     * Defines a type with an observable value
     */
    defineObservable<T>(name:string,defaultValue:TypeProvider<T>):ObservableTypeDef<T>;

    /**
     * Defines a type with an observable value that can optionally be undefined
     */
    defineObservable<T>(name:string):ObservableTypeDef<T|undefined>;

    /**
     * Defines a type with a readonly observable value
     */
    defineReadonlyObservable<T>(name:string,setter:Setter<T>|ScopedSetter<T>,defaultValue:TypeProvider<T>):ReadonlyObservableTypeDef<T>;

    /**
     * Defines a type with a readonly observable value that can optionally be undefined
     */
    defineReadonlyObservable<T>(name:string,setter:Setter<T>|ScopedSetter<T>):ReadonlyObservableTypeDef<T|undefined>;

    /**
     * Defines a type that has its value provided by a value provider. If no valueConverted is
     * provided JSON.parse will be used.
     */
    defineParam<T>(name:string,valueConverter?:(str:string,scope:Scope)=>T,defaultValue?:T):CallableTypeDef<T>;

    /**
     * Defines a type that has its value provided as a string by a value provider.
     */
    defineStringParam(name:string,defaultValue?:string):CallableTypeDef<string>;

    /**
     * Defines a type that has its value provided as a number by a value provider.
     */
    defineNumberParam(name:string,defaultValue?:number):CallableTypeDef<number>;

    /**
     * Defines a type that has its value provided as a boolean by a value provider.
     */
    defineBoolParam(name:string,defaultValue?:boolean):CallableTypeDef<boolean>;

    /**
     * Exposes the internal defaultType function
     */
    [ScopeDefineType]<T>(options:DefineTypeOptions<T>):TypeDef<T>;

    /**
     * Exposes the internal defaultCallableType function
     */
    [ScopeDefineCallableType]<T>(options:DefineTypeOptions<T>):CallableTypeDef<T>;

    /**
     * Resets the state of the scope. This function should only be used for testing.
     */
    [ScopeReset]():void;

    [ScopeInit](rootModule?:ScopeModule):void;


}



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
    isCallable?:boolean;
    generator?:boolean;
}

let isCreatingRoot=false;

export const createScope=(rootModule?:ScopeModule, cancel:CancelToken=new CancelToken(), parent?:Scope):Scope=>
{
    // state vars
    let providerMap:SymHashMap<TypeProviderInternal[]>={};
    let types:SymHashMap<TypeDef<any>>={};
    let initPromiseSource=createPromiseSource<void>();
    let initCalled=false;

    const isRoot=isCreatingRoot;
    isCreatingRoot=false;

    const isInited=()=>initPromiseSource.getStatus()==='resolved';

    const to=<T,D extends TypeDef<T>>(typeOrSetter:D|Setter<T>|ScopedSetter<T>):D|ScopedSetter<T>=>{
        if(isSetterOrScopedSetter(typeOrSetter)){
            if(isScopedSetter(typeOrSetter)){
                return createScopedSetter(scope,typeOrSetter.setter);
            }else{
                return createScopedSetter(scope,typeOrSetter);
            }
        }else{
            return toType(typeOrSetter as D);
        }
    }

    const requireType=<T>(type:TypeDef<T>,tag?:string):T=>
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
            return providers?providers[0]:undefined;
        }
    }

    const getParam=(name:string,defaultValue?:string):string|undefined=>{
        const providers=providerMap[ParamProviderType.id];
        if(!providers){
            return undefined;
        }
        const hasKey=name.replace(/_/g,'').toLowerCase();
        for(const p of providers){
            const valueP:ParamProvider|HashMap<string>=getProviderValue(p);
            if(typeof valueP.getParam === 'function'){
                const value=valueP.getParam(name);
                if(value!==undefined){
                    return value;
                }
            }else if(valueP){
                const value=(valueP as any)[hasKey];
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
            return subject(toType(type));
        }
        return type.subject as BehaviorSubject<T>;
    }

    const getType=(id:symbol):TypeDef<any>|undefined=>types[id];

    const get=<T>(type:TypeDef<T>,tag?:string):T|undefined=>{

        if(type.scope!==scope){
            return get(toType(type));
        }

        const staticValue=type[TypeDefStaticValue].value;

        if(staticValue!==undefined){
            return staticValue;
        }

        if(type.valueConverter){
            const provided=getParam(type.typeName);
            if(provided!==undefined){
                return type[TypeDefStaticValue].value=type.valueConverter(provided);
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
            if(value!==false && value!==continueFunction && value!==undefined){
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

    const toType=<T,D extends TypeDef<T>>(type:D):D=>type.clone(scope) as D;

    const map=<T extends TypeDef<any>[]>(...types:T):T=>{
        const mapped:TypeDef<any>[]=[];

        for(const type of types){
            mapped.push(toType(type))
        }

        return mapped as T;
    }

    const _defineCallableType=<T>(options:DefineTypeOptions<T>):CallableTypeDef<T>=>
    {
        const id=options.id??Symbol();
        options.id=id;
        options.isCallable=true;
        if(types[id]){
            return types[id] as CallableTypeDef<T>;
        }

        const typeDef=_defineType(options);
        const callable=(
            (scope?:Scope)=>scope?scope.to(callable).require():requireType(callable)
        ) as CallableTypeDef<T>;

        for(const e in typeDef){
            (callable as any)[e]=(typeDef as any)[e];
        }
        const symbols=Object.getOwnPropertySymbols(typeDef);
        for(const s of symbols){
            (callable as any)[s]=(typeDef as any)[s];
        }

        Object.freeze(callable);

        types[id]=callable;
        return callable;

    }

    const _defineType=<T>({
        name,
        defaultValue,
        id=Symbol(),
        valueConverter,
        defaultProvider,
        createSubject,
        subjectDefault,
        subjectSetter,
        generator,
        isCallable,
    }:DefineTypeOptions<T>):TypeDef<T>=>{
        if(types[id]){
            return types[id];
        }
        const typeDef:TypeDef<T>={
            clone:(scope:Scope):TypeDef<T>=>{
                const options:DefineTypeOptions<T>={
                    name,
                    defaultValue,
                    valueConverter,
                    id,
                    defaultProvider,
                    createSubject,
                    subjectDefault,
                    subjectSetter,
                    generator
                }
                if(isCallable){
                    return (scope as ScopeInternal)[ScopeDefineCallableType](options);
                }else{
                    return (scope as ScopeInternal)[ScopeDefineType](options);
                }
            },
            id:id,
            typeName:name,
            scope:scope,
            get:(tag?:string)=>get(typeDef,tag),
            all:(tag?:string)=>getAll(typeDef,tag),
            forEach:(tag:string|null|undefined,callback:(value:T,scope:Scope)=>void|boolean|FunctionLoopControl)=>scope.forEach<T>(typeDef,tag,callback),
            forEachAsync:(tag:string|null|undefined,callback:(value:T,scope:Scope)=>Promise<void|boolean|FunctionLoopControl>)=>scope.forEachAsync<T>(typeDef,tag,callback),
            getFirstAsync:<TValue>(tag:string|null|undefined,callback:(value:T,scope:Scope)=>Promise<TValue|false|FunctionLoopControl>)=>scope.getFirstAsync<T,TValue>(typeDef,tag,callback),
            getFirst:<TValue>(tag:string|null|undefined,callback:(value:T,scope:Scope)=>TValue|false|FunctionLoopControl)=>scope.getFirst<T,TValue>(typeDef,tag,callback),
            require:(tag?:string)=>requireType(typeDef,tag),
            valueConverter:valueConverter,
            [TypeDefDefaultValue]:defaultValue,
            [TypeDefStaticValue]:{},
        }
        if(generator){
            (typeDef as any as GeneratorTypeDef<AnyFunction>).generate=(...args:any[])=>{
                return (typeDef as any as GeneratorTypeDef<AnyFunction>).getFirst(null,factory=>factory(...args));
            }
        }
        types[id]=typeDef;
        if(defaultProvider){
            _provideForType(typeDef,defaultProvider,[],true);
        }
        if(createSubject){
            const subject=new BehaviorSubject<T>(subjectDefault?.(scope) as any);
            (typeDef as any).subject=subject;
            subject.subscribe(v=>typeDef[TypeDefStaticValue].value=v);
            if(subjectSetter){
                subjectSetter.subject.subscribe(v=>{
                    if(v.scope===scope){
                        subject.next(v.value)
                    }
                });
            }
            typeDef[TypeDefStaticValue].value=subjectDefault?.(scope);
        }
        Object.freeze(typeDef);
        return typeDef;
    }

    const defineType=<T>(name:string,defaultProvider?:TypeProvider<T>|TypeProviderOptions<T>):TypeDef<T>=>(
        _defineType<T>({name,defaultProvider})
    )

    const defineGeneratorType=<T extends AnyFunction>(name:string,defaultFactory?:T):GeneratorTypeDef<T>=>(
        _defineType<T>({name,defaultProvider:defaultFactory?()=>defaultFactory:undefined,generator:true}) as GeneratorTypeDef<T>
    )

    const defineCallableType=<T>(name:string,defaultProvider?:TypeProvider<T>|TypeProviderOptions<T>):CallableTypeDef<T>=>(
        _defineCallableType<T>({name,defaultProvider})
    )

    const defineObservable=<T>(name:string,defaultValue?:TypeProvider<T>):ObservableTypeDef<T>=>
    (
        _defineCallableType({
            name,
            createSubject:true,
            subjectDefault:defaultValue,
        }) as ObservableTypeDef<T>
    )

    const defineReadonlyObservable=<T>(name:string,setter:Setter<T>|ScopedSetter<T>,defaultValue?:TypeProvider<T>):ReadonlyObservableTypeDef<T>=>
    (
        _defineCallableType({
            name,
            createSubject:true,
            subjectDefault:defaultValue,
            subjectSetter:setter,
        }) as ReadonlyObservableTypeDef<T>
    )

    const addParams=(valueProvider?:ParamProvider|HashMap<string>):void=>
    {
        if(!valueProvider){
            return;
        }
        if(typeof (valueProvider as Partial<ParamProvider>).getParam === 'function'){
            provideForType(ParamProviderType,()=>valueProvider);
        }else{
            const map:HashMap<string>={}
            for(const e in valueProvider){
                map[e.replace(/_/g,'').toLowerCase()]=(valueProvider as any)[e];
            }
            provideForType(ParamProviderType,()=>map);
        }
    }

    const defineParam=<T>(name:string,valueConverter?:(str:string,scope:Scope)=>T,defaultValue?:T):CallableTypeDef<T>=>
    (
        _defineCallableType<T>({
            name,
            defaultValue,
            valueConverter:valueConverter?str=>valueConverter(str,scope):(str=>JSON.parse(str))
        })
    )

    const defineStringParam=(name:string,defaultValue?:string):CallableTypeDef<string>=>_defineCallableType<string>({name,defaultValue,valueConverter:str=>str});

    const defineNumberParam=(name:string,defaultValue?:number):CallableTypeDef<number>=>_defineCallableType<number>({name,defaultValue,valueConverter:str=>Number(str)});

    const defineBoolParam=(name:string,defaultValue?:boolean):CallableTypeDef<boolean>=>_defineCallableType<boolean>({name,defaultValue,valueConverter:parseConfigBool});



    const provideForType=<T,P extends T>(
        type:TypeDef<T>,
        provider:TypeProvider<P>|TypeProviderOptions<P>,
        tags:string|string[]=[]
    ):FluentTypeProvider<P>=>{
        return _provideForType(type,provider,tags);
    }

    const _provideForType=<T,P extends T>(
        type:TypeDef<T>,
        provider:TypeProvider<P>|TypeProviderOptions<P>,
        tags:string|string[]=[],
        allowInited=false
    ):FluentTypeProvider<P>=>{

        if(!allowInited && isInited()){
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

        providers.unshift({
            type,
            provider:_provider,
            tags,
        })

        const fluent:FluentTypeProvider<P>={
            and<T>(
                type:TypeDef<FluentProviderType<T,P>>,
                tags:string|string[]=[]
            ):FluentTypeProvider<P>{

                tags=asArray(tags);

                let providers=providerMap[type.id];
                if(!providers){
                    providers=[];
                    providerMap[type.id]=providers;
                }
                providers.unshift({
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



    const init=(rootModule:ScopeModule|undefined)=>{
        if(initCalled){
            throw new Error('Scope already inited');
        }
        initCalled=true;
        if(rootModule){
            initScopeAsync({
                scope,
                cancel,
                provideForType,
                addParams,
                rootModule
            }).then(()=>initPromiseSource.resolve()).catch(r=>initPromiseSource.reject(r));
        }else{
            initPromiseSource.resolve();
        }
    }

    const reset=()=>{
        const currentTypes=types;
        providerMap={};
        types={};
        initPromiseSource=createPromiseSource<void>();
        const typeIds=Object.getOwnPropertySymbols(currentTypes);
        for(const id of typeIds){
            currentTypes[id].clone(scope);
        }
        initCalled=false;
        if(!isRoot){
            init(rootModule);
        }
    }


    const scope:ScopeInternal=Object.freeze({
        require: requireType,
        get,
        getType,
        getAll,
        forEach,
        forEachAsync,
        getFirstAsync,
        getFirst,
        subject,
        to,
        map,
        defineType,
        defineGeneratorType,
        defineCallableType,
        defineObservable,
        defineReadonlyObservable,
        getParam:getParam as any,
        requireParam,
        defineParam,
        defineStringParam,
        defineNumberParam,
        defineBoolParam,
        createChild,
        recreate,
        parent,
        isInited,
        getInitPromise:()=>initPromiseSource.promise,
        [ScopeDefineType]:_defineType,
        [ScopeDefineCallableType]:_defineCallableType,
        [ScopeReset]:reset,
        [ScopeInit]:init
    })

    if(!isRoot){
        init(rootModule);
    }

    return scope;
}

interface InitScopeOptions
{
    scope:Scope;
    cancel:CancelToken;
    addParams(valueProvider?:ParamProvider|HashMap<string>):void;
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
    addParams,
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
        let lifecycles:ScopeModuleLifecycle[]=[];
        let modules:ScopeModule[]=[];
        const reg:ScopeRegistration={
            scope,
            cancel,
            addParams:addParams,
            implement:provideForType,
            implementService:provideForType,
            implementClient:provideForType,
            addProvider:provideForType,
            addFactory<T extends AnyFunction,P extends T>(
                type:FactoryTypeDef<T>,
                provider:P,
                tags?:string|string[]
            ):FluentTypeProvider<P>{
                return provideForType(type,{
                    provider:()=>provider,
                },tags)
            },
            use(moduleOrLifecycle?:ScopeModule|ScopeModuleLifecycle){
                if(!moduleOrLifecycle){
                    return;
                }
                if(typeof moduleOrLifecycle === 'function'){
                    if(!modules.includes(moduleOrLifecycle)){
                        modules.push(moduleOrLifecycle);
                        moduleOrLifecycle(reg);
                    }
                }else{
                    if(!lifecycles.includes(moduleOrLifecycle)){
                        lifecycles.push(moduleOrLifecycle);
                    }
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

        // release references
        lifecycles=[];
        modules=[];

    }catch(ex){
        console.error('Scope initialization failed',ex);
        disposeModules();
    }
}


const rootCancel=new CancelToken();
isCreatingRoot=true;
export const rootScope=createScope(undefined,rootCancel,undefined) as ScopeInternal;
isCreatingRoot=false;
const ParamProviderType=rootScope.defineType<ParamProvider|HashMap<string>>('ParamProvider');

export const initRootScope=(rootModule?:ScopeModule)=>{

    rootScope[ScopeInit](rootModule);
}

export const defineType=<T>(
    name:string,
    defaultProvider?:TypeProvider<T>|TypeProviderOptions<T>)
    :TypeDef<T>=>rootScope.defineType<T>(name,defaultProvider);


export const defineProvider=<T>(
    name:string,
    defaultProvider?:TypeProvider<T>|TypeProviderOptions<T>)
    :ProviderTypeDef<T>=>rootScope.defineType<T>(name,defaultProvider);

export const defineFactory=<T extends AnyFunction>(
    name:string,
    defaultFactory?:T)
    :FactoryTypeDef<T>=>rootScope.defineGeneratorType<T>(name,defaultFactory);

export const defineCallableType=<T>(
    name:string,
    defaultProvider?:TypeProvider<T>|TypeProviderOptions<T>)
    :CallableTypeDef<T>=>rootScope.defineCallableType<T>(name,defaultProvider);

export const defineService=<T>(
    name:string,
    defaultProvider?:TypeProvider<T>|TypeProviderOptions<T>)
    :ServiceTypeDef<T>=>rootScope.defineCallableType<T>(name,defaultProvider);

export const defineClient=<T>(
    name:string,
    defaultProvider?:TypeProvider<T>|TypeProviderOptions<T>)
    :ClientTypeDef<T>=>rootScope.defineCallableType<T>(name,defaultProvider);

export const defineServiceFactory=<T>(
    name:string,
    provider:TypeProvider<T>)
    :ServiceTypeDef<T>=>rootScope.defineCallableType<T>(name,{provider,isFactory:true});

export const defineClientFactory=<T>(
    name:string,
    provider:TypeProvider<T>)
    :ClientTypeDef<T>=>rootScope.defineCallableType<T>(name,{provider,isFactory:true});

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

export const defineParam=<T>(name:string,valueConverter?:(str:string,scope:Scope)=>T,defaultValue?:T):ParamTypeDef<T>=>(
    rootScope.defineParam(name,valueConverter,defaultValue)
)

export const defineStringParam=(name:string,defaultValue?:string):ParamTypeDef<string>=>(
    rootScope.defineStringParam(name,defaultValue)
)

export const defineNumberParam=(name:string,defaultValue?:number):ParamTypeDef<number>=>(
    rootScope.defineNumberParam(name,defaultValue)
)

export const defineBoolParam=(name:string,defaultValue?:boolean):ParamTypeDef<boolean>=>(
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


