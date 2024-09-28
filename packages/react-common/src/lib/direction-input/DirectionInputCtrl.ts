import { Direction, ReadonlySubject } from "@iyio/common";
import { BehaviorSubject, Observable, Subject } from "rxjs";

export class DirectionInputCtrl
{
    private readonly _onDirectionInput=new Subject<Direction>();
    public get onDirectionInput():Observable<Direction>{return this._onDirectionInput}

    private readonly _index:BehaviorSubject<number>=new BehaviorSubject<number>(0);
    public get indexSubject():ReadonlySubject<number>{return this._index}
    public get index(){return this._index.value}
    public set index(value:number){
        if(value==this._index.value){
            return;
        }
        this._index.next(value);
    }

    private readonly _count:BehaviorSubject<number>=new BehaviorSubject<number>(0);
    public get countSubject():ReadonlySubject<number>{return this._count}
    public get count(){return this._count.value}
    public set count(value:number){
        if(value==this._count.value){
            return;
        }
        this._count.next(value);
    }

    public triggerInput(direction:Direction){
        this._onDirectionInput.next(direction);
    }
}
