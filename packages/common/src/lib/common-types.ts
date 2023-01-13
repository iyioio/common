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

export interface Size
{
    width:number;
    height:number;
}

export type DisposeCallback=()=>void;

export type SideEffectCallback=((success:boolean)=>void|Promise<void>)|Promise<void>;

export type HashMap<T=any>={[key:string]:T}

export type SymHashMap<T=any>={[key:symbol]:T}

export type SymStrHashMap<T=any>={[key:symbol|string]:T}

export type FirstArg<T> = T extends (arg: infer A) => any ? A : never;

export type NoId<T>=Omit<T,'id'>;

export type ValueKeyProvider<T>=(keyof T)|((value:T)=>string|number);

export type StringOrEmpty=string|null|undefined;

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

export type Side='left'|'right'|'top'|'bottom';
