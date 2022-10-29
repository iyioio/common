
import { BehaviorSubject } from "rxjs";
import { ListPointer, ValuePointer } from "./pointers";
import { ReadonlySubject } from "./rxjs-types";

export class SharedValuePointer<T=any> implements ValuePointer<T>
{
    public readonly _valueSource:BehaviorSubject<T|undefined>;
    public readonly subject:ReadonlySubject<T|undefined>;
    public get value(){return this._valueSource.value}
    private readonly onDispose?:()=>void;
    public usage:number;

    public constructor(value:T|undefined,onDispose?:()=>void)
    {
        this._valueSource=new BehaviorSubject(value);
        this.subject=this._valueSource;
        this.onDispose=onDispose;
        this.usage=0;
    }

    public dispose(): void {
        this.usage--;
        if(this.usage<=0){
            this.onDispose?.();
        }
    }
}


export class SharedListPointer<T=any> implements ListPointer<T>
{
    public readonly changeCountSource:BehaviorSubject<number>;
    public readonly changeCount:ReadonlySubject<number>;
    public readonly _listSource:T[];
    public readonly list:ReadonlyArray<T>;
    private readonly _onDispose?:()=>void;
    public usage:number;

    public constructor(list:T[],onDispose?:()=>void)
    {
        this.changeCountSource=new BehaviorSubject(0);
        this.changeCount=this.changeCountSource;
        this._listSource=list;
        this.list=list;
        this._onDispose=onDispose;
        this.usage=0;
    }

    public dispose(): void {
        this.usage--;
        if(this.usage<=0){
            this._onDispose?.();
        }
    }
}
