import { BehaviorSubject } from "rxjs";
import { HashMap } from "./common-types";
import { ReadonlySubject } from "./rxjs-types";
import { Setter } from "./Setter";
import { TypeDefDefaultValue, TypeDefStaticValue } from "./_internal.common";

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
     * Provides a value for the type. If no matching provider is found by the scope of the type
     * an error will be thrown.
     */
    ():T;

    /**
     * Provides a value for the type. If no matching provider is found by the scope of the type
     * an error will be thrown.
     */
    require():T;

    /**
     * Provides a value for the type. If no matching provider is found by the scope of the type
     * undefined is returned.
     */
    get():T|undefined;

    /**
     * Returns all provided values for the type. Values can be optionally be filtered out by using
     * the tag parameter.
     */
    all(tag?:string):T[];
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
    <T>(type:TypeDef<T>):T;

    /**
     * Gets a value or throws an error if no provider is found
     */
    require<T>(type:TypeDef<T>):T;

    /**
     * Gets a value or returns undefined if no provider is found
     */
    get<T>(type:TypeDef<T>):T|undefined;

    /**
     * Returns all values provided for the type. A type can have multiple providers.
     */
    getAll<T>(type:TypeDef<T>,tag?:string):T[];

    /**
     * Returns a new type scoped to this scope
     */
    to<T>(type:TypeDef<T>):TypeDef<T>;

    /**
     * Returns an array of types scoped to this scope
     */
    map<T extends TypeDef<any>[]>(...types:T):T;

    /**
     * Defines a new type
     */
    defineType<T>(name:string):TypeDef<T>;

    /**
     * Provides a value for the given type
     */
    provideType<T>(type:TypeDef<T>,provider:TypeProvider<T>|TypeProviderOptions<T>,tags?:string|string[]):void;

    /**
     * Defines a type with an observable value
     */
    defineObservable<T>(name:string,defaultValue:T):TypeDef<BehaviorSubject<T>>;

    /**
     * Defines a type with an observable value that can optionally be undefined
     */
    defineObservable<T>(name:string):TypeDef<BehaviorSubject<T|undefined>>;

    /**
     * Defines a type with a readonly observable value
     */
    defineReadonlyObservable<T>(name:string,setter:Setter<T>,defaultValue:T):TypeDef<ReadonlySubject<T>>;

    /**
     * Defines a type with a readonly observable value that can optionally be undefined
     */
    defineReadonlyObservable<T>(name:string,setter:Setter<T>):TypeDef<ReadonlySubject<T|undefined>>;


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

