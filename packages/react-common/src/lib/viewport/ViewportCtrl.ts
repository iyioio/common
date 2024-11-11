import { ReadonlySubject, removeBehaviorSubjectAryValue } from "@iyio/common";
import { BehaviorSubject } from "rxjs";
import { SurfaceCtrl } from "./SurfaceCtrl";

export class ViewportCtrl
{
    private readonly _index:BehaviorSubject<number>=new BehaviorSubject<number>(0);
    public get indexSubject():ReadonlySubject<number>{return this._index}
    public get index(){return this._index.value}
    public set index(value:number){
        if(value==this._index.value){
            return;
        }
        this._index.next(value);
    }

    private readonly _navLockCount:BehaviorSubject<number>=new BehaviorSubject<number>(0);
    public get navLockCountSubject():ReadonlySubject<number>{return this._navLockCount}
    public get navLockCount(){return this._navLockCount.value}
    public set navLockCount(value:number){
        if(value==this._navLockCount.value){
            return;
        }
        this._navLockCount.next(value);
    }

    private readonly _surfaces:BehaviorSubject<SurfaceCtrl[]>=new BehaviorSubject<SurfaceCtrl[]>([]);
    public get surfacesSubject():ReadonlySubject<SurfaceCtrl[]>{return this._surfaces}
    public get surfaces(){return this._surfaces.value}

    public addSurface(surface:SurfaceCtrl){
        const update=[...this._surfaces.value,surface];
        update.sort((a,b)=>a.index-b.index);
        this._surfaces.next(update);
    }

    public removeSurface(surface:SurfaceCtrl){
        removeBehaviorSubjectAryValue(this._surfaces,surface);
    }
}
