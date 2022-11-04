import { BehaviorSubject } from "rxjs";
import { FunctionLoopControl } from "./common-lib";
import { HashMap } from "./common-types";
import { ReadonlySubject } from "./rxjs-types";
import { ScopedSetter, Setter } from "./Setter";
import { TypeDefDefaultValue, TypeDefStaticValue } from "./_internal.common";

export interface ObservableTypeDef<T> extends TypeDef<T>
{
    readonly subject:BehaviorSubject<T>;
}

export interface ReadonlyObservableTypeDef<T> extends TypeDef<T>
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
    [TypeDefStaticValue]?:T;

    /**
     * The default value of the type
     */
    [TypeDefDefaultValue]?:T;

    /**
     * Clones the type
     */
    readonly clone:(scope:Scope)=>TypeDef<T>;

    /**
     * Provides a value for the type. If no matching provider is found by the scope of the type
     * an error will be thrown.
     */
    (tag?:string):T;

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

export interface ValueProvider
{
    getValue(name:string):string|undefined;
}

export interface Scope
{
    /**
     * If a scope can not find a matching provider when getting a value if will attempt to get
     * the value from its parent
     */
    readonly parent?:Scope;

    /**
     * Returns a scoped value for the given type. This is an alias of the to method.
     */
    <T>(type:TypeDef<T>,tag?:string):T;

    <T>(setter:Setter<T>):ScopedSetter<T>;

    <T>(setter:ScopedSetter<T>):ScopedSetter<T>;

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
     * Returns a new type scoped to this scope
     */
    to<T,D extends TypeDef<T>>(type:D):D;

    /**
     * Returns an array of types scoped to this scope
     */
    map<T extends TypeDef<any>[]>(...types:T):T;

    /**
     * Defines a new type
     */
    defineType<T>(name:string,defaultProvider?:TypeProvider<T>|TypeProviderOptions<T>):TypeDef<T>;

    /**
     * Provides a value for the given type
     */
    provideForType<T,P extends T>(
        type:TypeDef<T>,
        provider:TypeProvider<P>|TypeProviderOptions<P>,
        tags?:string|string[]
    ):FluentTypeProvider<P>;

    /**
     * Provides a value for the given type. Alias for provideForType
     */
    provideForService<T,P extends T>(
        type:TypeDef<T>,
        provider:TypeProvider<P>|TypeProviderOptions<P>,
        tags?:string|string[]
    ):FluentTypeProvider<P>;

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
     * Provides values that can be retired by types defined with defineValue, defaultString,
     * defineNumber or defineBool or the getProvidedValue method.
     */
    provideValues(valueProvider:ValueProvider|HashMap<string>):void;

    /**
     * Returns a provided string value by name.
     */
    getProvidedValue(name:string):string|undefined;

    /**
     * Returns a provided string value by name or throw an error
     */
    requireProvidedValue(name:string):string;

    /**
     * Defines a type that has its value provided by a value provider. If no valueConverted is
     * provided JSON.parse will be used.
     */
    defineValue<T>(name:string,valueConverter?:(str:string,scope:Scope)=>T,defaultValue?:T):TypeDef<T>;

    /**
     * Defines a type that has its value provided as a string by a value provider.
     */
    defineString(name:string,defaultValue?:string):TypeDef<string>;

    /**
     * Defines a type that has its value provided as a number by a value provider.
     */
    defineNumber(name:string,defaultValue?:number):TypeDef<number>;

    /**
     * Defines a type that has its value provided as a boolean by a value provider.
     */
    defineBool(name:string,defaultValue?:boolean):TypeDef<boolean>;
}

/**
 * Used to fluently provide a provider for additional types.
 */
export interface FluentTypeProvider<P>
{
    andFor<T>(
        type:TypeDef<FluentProviderType<T,P>>,
        tags?:string|string[]
    ):FluentTypeProvider<P>;

    getValue():P;
}

export type FluentProviderType<T,P>=P extends T?T:never;
