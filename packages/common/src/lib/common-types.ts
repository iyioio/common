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

export type DisposeCallback=()=>void;

export type SideEffectCallback=((success:boolean)=>void|Promise<void>)|Promise<void>;

export type HashMap<T=any>={[key:string]:T}

export type FirstArg<T> = T extends (arg: infer A) => any ? A : never;

export type NoId<T>=Omit<T,'id'>;

export type ValueKeyProvider<T>=(keyof T)|((value:T)=>string|number);

export type StringOrEmpty=string|null|undefined;

export interface ISubscription
{
    unsubscribe():void;
}
