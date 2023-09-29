import { BehaviorSubject } from "rxjs";
import { ReadonlySubject } from "./rxjs-types";

export class ValueBag{

    private readonly _values:BehaviorSubject<Record<string,any>>=new BehaviorSubject<Record<string,any>>({});
    public get valuesSubject():ReadonlySubject<Record<string,any>>{return this._values}
    public get values(){return this._values.value}

    public get(key:string):any{
        return this._values.value[key];
    }

    public set(key:string,value:any){
        if(this._values.value[key]===value){
            return;
        }
        if(value===undefined){
            this.remove(key);
        }else{
            this._values.next({...this._values.value,[key]:value});
        }
    }

    public remove(key:string){
        if(this._values.value[key]===undefined){
            return;
        }
        const obj={...this._values.value};
        delete obj[key];
        this._values.next(obj);
    }
}
