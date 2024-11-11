import { ReadonlySubject } from "@iyio/common";
import { BehaviorSubject } from "rxjs";

export class SurfaceCtrl
{
    public readonly index:number;
    public readonly elem:HTMLElement;

    private readonly _active:BehaviorSubject<boolean>=new BehaviorSubject<boolean>(false);
    public get activeSubject():ReadonlySubject<boolean>{return this._active}
    public get active(){return this._active.value}
    public set active(value:boolean){
        if(value==this._active.value){
            return;
        }
        this._active.next(value);
    }

    public constructor(index:number,elem:HTMLElement){
        this.index=index;
        this.elem=elem;
    }
}
