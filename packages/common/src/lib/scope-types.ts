import { BehaviorSubject } from "rxjs";
import { CancelToken } from "./CancelToken";
import { FunctionLoopControl } from "./common-lib";
import { AnyFunction, HashMap, OpValueContainer } from "./common-types";
import { ReadonlySubject } from "./rxjs-types";
import { ScopedSetter, Setter } from "./Setter";
import { TypeDefDefaultValue, TypeDefStaticValue } from "./_internal.common";


export interface CallableTypeDef<T> extends TypeDef<T>
{

    /**
     * Provides a value for the type. If no matching provider is found by the scope of the type
     * an error will be thrown.
     * @param scope If provided the returned value will be scoped to the provided scope
     */
    (scope?:Scope):T;
}

export interface ObservableTypeDef<T> extends CallableTypeDef<T>
{
    readonly subject:BehaviorSubject<T>;
}

export interface ReadonlyObservableTypeDef<T> extends CallableTypeDef<T>
{
    readonly subject:ReadonlySubject<T>;
}

export interface TypeDef<T>
{
    /**
     * A unique id for the type
     */
    readonly id:symbol;

    /**
     * The name of the type
     */
    readonly typeName:string;

    /**
     * The scope that type belongs to.
     */
    readonly scope:Scope;

    /**
     * An optional converter that converts string values when providing a value
     */
    readonly valueConverter?:(str:string)=>T;

    /**
     * Used to cache the value of the type
     */
    readonly [TypeDefStaticValue]:OpValueContainer<T>;

    /**
     * The default value of the type
     */
    readonly [TypeDefDefaultValue]?:T;

    /**
     * Clones the type
     */
    clone(scope:Scope):TypeDef<T>;

    /**
     * Provides a value for the type. If no matching provider is found by the scope of the type
     * an error will be thrown.
     */
    require(tag?:string):T;

    /**
     * Provides a value for the type. If no matching provider is found by the scope of the type
     * undefined is returned.
     */
    get(tag?:string):T|undefined;

    /**
     * Returns all provided values for the type. Values can be optionally be filtered out by using
     * the tag parameter.
     */
    all(tag?:string):T[];

    forEach(tag:string|null|undefined,callback:(value:T,scope:Scope)=>void|boolean|FunctionLoopControl):void;

    forEachAsync(tag:string|null|undefined,callback:(value:T,scope:Scope)=>Promise<void|boolean|FunctionLoopControl>):Promise<void>;

    getFirstAsync<TValue>(tag:string|null|undefined,callback:(value:T,scope:Scope)=>Promise<TValue|false|FunctionLoopControl>):Promise<TValue|undefined>;

    getFirst<TValue>(tag:string|null|undefined,callback:(value:T,scope:Scope)=>TValue|false|FunctionLoopControl):TValue|undefined;
}

/**
 * Provides a value for a type in the given scope.
 */
export type TypeProvider<T>=(scope:Scope)=>T;

export interface TypeProviderOptions<T=any>
{
    provider:TypeProvider<T>;
    tag?:string;
    tags?:string[];
    /**
     * If true a new instance of the providers type will be called every time a instance is
     * requested for.
     */
    isFactory?:boolean;
}

export interface ParamProvider
{
    getParam(name:string):string|undefined;
}

export interface Scope
{
    /**
     * If a scope can not find a matching provider when getting a value if will attempt to get
     * the value from its parent
     */
    readonly parent?:Scope;

    getInitPromise():Promise<void>;

    isInited():boolean;

    /**
     * Returns an array of types scoped to this scope
     */
    map<T extends TypeDef<any>[]>(...types:T):T;

    /**
     * Returns a new type scoped to this scope
     */
    to<T,D extends TypeDef<T>>(type:D):D;

    to<T>(setter:Setter<T>):ScopedSetter<T>;

    to<T>(setter:ScopedSetter<T>):ScopedSetter<T>;

    /**
     * Creates a scope with the current scope as its parent. Child scope will fallback to getting
     * values with the child can not find one.
     * @param appendModule If defined the the module will be included after the root module of the
     *                     current scope
     */
    createChild(appendModule?:ScopeModule):Scope;

    /**
     * Creates a new scope using the current scopes root module. This will create a new scope with
     * the same registered types and params but will have its own set of unique values. The new
     * scope will be completely independent of the current scope.
     * @param appendModule If defined the the module will be included after the root module of the
     *                     current scope
     */
    recreate(appendModule?:ScopeModule,cancel?:CancelToken):Scope;

    /**
     * Gets a value or throws an error if no provider is found
     */
    require<T>(type:TypeDef<T>,tag?:string):T;

    /**
     * Gets a value or returns undefined if no provider is found
     */
    get<T>(type:TypeDef<T>,tag?:string):T|undefined;

    /**
     * Returns a BehaviorSubject for a given type
     */
    subject<T>(type:ObservableTypeDef<T>):BehaviorSubject<T>;

    /**
     * Returns a ReadonlySubject for a given type
     */
    subject<T>(type:ReadonlyObservableTypeDef<T>):ReadonlySubject<T>;

    /**
     * Returns a type TypeDef for the given id
     */
    getType(id:symbol):TypeDef<any>|undefined;

    /**
     * Returns all values provided for the type. A type can have multiple providers.
     */
    getAll<T>(type:TypeDef<T>,tag?:string):T[];

    forEach<T>(typeRef:TypeDef<T>,tag:string|null|undefined,callback:(value:T,scope:Scope)=>void|boolean|FunctionLoopControl):void;

    forEachAsync<T>(typeRef:TypeDef<T>,tag:string|null|undefined,callback:(value:T,scope:Scope)=>Promise<void|boolean|FunctionLoopControl>):Promise<void>;

    getFirstAsync<T,TValue>(typeRef:TypeDef<T>,tag:string|null|undefined,callback:(value:T,scope:Scope)=>Promise<TValue|false|FunctionLoopControl>):Promise<TValue|undefined>;

    getFirst<T,TValue>(typeRef:TypeDef<T>,tag:string|null|undefined,callback:(value:T,scope:Scope)=>TValue|false|FunctionLoopControl):TValue|undefined;

    /**
     * Returns a provided string value by name.
     */
    getParam(name:string,defaultValue:string):string;

    /**
     * Returns a provided string value by name.
     */
    getParam(name:string):string|undefined;


    /**
     * Returns a provided string value by name or throw an error
     */
    requireParam(name:string):string;
}

/**
 * Used to fluently provide a provider for additional types.
 */
export interface FluentTypeProvider<P>
{
    and<T>(
        type:TypeDef<FluentProviderType<T,P>>,
        tags?:string|string[]
    ):FluentTypeProvider<P>;

    getValue():P;
}

export type FluentProviderType<T,P>=P extends T?T:never;

export interface ScopeRegistration
{
    scope:Scope;

    readonly cancel:CancelToken;

    /**
     * Provides values that can be retired by types defined with defineValue, defaultString,
     * defineNumber or defineBool or the getProvidedValue method.
     */
    addParams(valueProvider?:ParamProvider|HashMap<string>):void;

    /**
     * Provides an implementation the given TypeDef.
     */
    implement<T,P extends T>(
        type:TypeDef<T>,
        provider:TypeProvider<P>|TypeProviderOptions<P>,
        tags?:string|string[]
    ):FluentTypeProvider<P>;

    /**
     * Provides a service implementation the given ServiceTypeDef. Alias for implement
     */
    implementService<T,P extends T>(
        type:ServiceTypeDef<T>,
        provider:TypeProvider<P>|TypeProviderOptions<P>,
        tags?:string|string[]
    ):FluentTypeProvider<P>;

    /**
     * Provides a provider for the given ProviderTypeDef. Alias for implement
     */
    addProvider<T,P extends T>(
        type:ProviderTypeDef<T>,
        provider:TypeProvider<P>|TypeProviderOptions<P>,
        tags?:string|string[]
    ):FluentTypeProvider<P>;

    /**
     * Provides a factory for the given FactoryTypeDef.
     */
    addFactory<T extends AnyFunction,P extends T>(
        type:FactoryTypeDef<T>,
        provider:P,
        tags?:string|string[]
    ):FluentTypeProvider<P>;

    /**
     * Provides a client implementation for the given ClientTypeDef. Alias for implement
     */
    implementClient<T,P extends T>(
        type:ClientTypeDef<T>,
        provider:TypeProvider<P>|TypeProviderOptions<P>,
        tags?:string|string[]
    ):FluentTypeProvider<P>;

    use(lifecycle?:ScopeModuleLifecycle):void;
    use(module?:ScopeModule):void;
}

export interface ScopeModuleLifecycle
{
    /**
     * The higher the priority the earlier the scope will be initialized.
     */
    priority?:number;
    init?(scope:Scope,cancel:CancelToken):void|Promise<void>;
    onAllInited?(scope:Scope):void;
    dispose?(scope:Scope):void;
}
export type ScopeModule=(reg:ScopeRegistration)=>void;



export type ProviderTypeDef<T>=TypeDef<T>;

export interface GeneratorTypeDef<T extends AnyFunction> extends TypeDef<T>
{
    generate:T;
}

export type FactoryTypeDef<T extends AnyFunction>=GeneratorTypeDef<T>

export type ServiceTypeDef<T>=CallableTypeDef<T>;

export type ClientTypeDef<T>=CallableTypeDef<T>;

export type ParamTypeDef<T>=CallableTypeDef<T>;
