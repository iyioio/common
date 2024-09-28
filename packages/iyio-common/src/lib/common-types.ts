/* eslint-disable @typescript-eslint/no-unused-vars */
export interface LatLng
{
    lat:number;
    lng:number;
}

export interface Point
{
    x:number;
    y:number;
}

export interface Rect
{
    x:number;
    y:number;
    width:number;
    height:number;
}

export interface Sides
{
    left:number;
    right:number;
    top:number;
    bottom:number;
}

export interface PointOrSides
{
    left:number;
    top:number;
    right?:number;
    bottom?:number;
}

export interface OptionalSides
{
    left?:number;
    right?:number;
    top?:number;
    bottom?:number;
}

export interface OptionalBooleanSides
{
    left?:boolean;
    right?:boolean;
    top?:boolean;
    bottom?:boolean;
}

export interface Size
{
    width:number;
    height:number;
}

export type DisposeCallback=()=>void;

export type LogCallback=(...args:any[])=>void;

export type SideEffectCallback=((success:boolean)=>void|Promise<void>)|Promise<void>;

export type HashMap<T=any>={[key:string]:T}

export type SymHashMap<T=any>={[key:symbol]:T}

export type SymStrHashMap<T=any>={[key:symbol|string]:T}

export type FirstArg<T> = T extends (arg: infer A) => any ? A : never;

export type NoId<T>=Omit<T,'id'>;

export type OptionalId<T extends {id:any}>=(Omit<T,'id'> & Partial<Pick<T,'id'>>);

export type ValueKeyProvider<T>=(keyof T)|((value:T)=>string|number);

export type StringOrEmpty=string|null|undefined;

export interface MutableRef<T>{
    /**
     * A value that can be mutated
     */
    mutableRef:T;

    /**
     * Can be used to indicate that the value has been mutated, but does not have to be used.
     */
    mutated?:boolean;
}

/**
 * A boxed reference to a value
 */
export interface ValueRef<T>{
    /**
     * The referenced value
     */
    value:T;
}

export interface ISubscription
{
    unsubscribe():void;
}

export interface IDisposable
{
    dispose():void;
}

export interface IOpDisposable
{
    readonly dispose?:()=>void;
}


export interface IInit
{
    init():Promise<void>|void;
}

export interface IOpInit
{
    init?():Promise<void>|void;
}

export interface OpValueContainer<T>
{
    value?:T;
}

export type EmptyFunction=()=>void;

export type AnyFunction=(...args:any[])=>any;

export type AnyAsyncFunction=(...args:any[])=>Promise<any>;

export type Side='left'|'right'|'top'|'bottom';

export type Direction='up'|'down'|'left'|'right';

export interface AliasRecord<T=any>
{
    default:T;
    all:T[];
}

export type AliasLookup<T>=Record<string,AliasRecord<T>>;

export type RecursiveKeyOf<T>={
    [TKey in keyof Required<NonNullable<T>> & (string|number)]:
        Required<NonNullable<T>>[TKey] extends any[]?`${TKey}`:
        Required<NonNullable<T>>[TKey] extends object
            ?`${TKey}`|`${TKey}.${RecursiveKeyOf<Required<NonNullable<T>>[TKey]>}`
            :`${TKey}`;
}[keyof Required<NonNullable<T>>&(string|number)];

export type FirstNameInPath<T extends string>=T extends `${infer Name}.${infer _Rest}`?Name:T;

export type PathAfterDot<T extends string>=T extends `${infer _Name}.${infer Rest}`?Rest:never;

export type PathValue<
    T,
    Path extends string
>=(
    Path extends keyof T?
        T[Path]
    :FirstNameInPath<Path> extends keyof T?
        PathValue<Required<T>[FirstNameInPath<Path>],PathAfterDot<Path>>
    :
        never
)


export type RecursiveMap<T extends object,PropType>={
    [K in keyof T]:Required<T>[K] extends object?
        RecursiveMap<Required<T>[K],PropType>
    :
        PropType
}
export type RecursiveOptionalMap<T,PropType>=T extends object?{
    [K in keyof T]?:RecursiveOptionalMap<Required<T>[K],PropType>
}:T


export type InternalOptions<
    T,
    TOptionalProps extends (keyof T)|''='',
    TOmittedProps extends (keyof T)|''=''
>=Omit<{
    [K in keyof Required<T>]:K extends TOptionalProps?
        Required<T>[K]|undefined
    :K extends TOmittedProps?
        never
    :
        Required<T>[K]
},TOmittedProps>
