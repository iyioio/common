import { HashMap } from "./common-types";
import { getObjKeyCount } from "./object";
import { SharedValuePointer } from "./shared-pointers";
import { IStore, StoreKeyScope } from "./store-types";

export abstract class BaseStore<T> implements IStore<T>
{

    public keyBase?:string;

    public keyReg?:RegExp;

    public keyRegIndex?:number;

    public keyCondition?:(key:string)=>string|boolean;

    protected readonly pointers:HashMap<SharedValuePointer<T>>={};

    public constructor(keyFilter?:StoreKeyScope)
    {
        if(keyFilter){
            this.keyBase=keyFilter.keyBase;
            this.keyReg=keyFilter.keyReg;
            this.keyRegIndex=keyFilter.keyRegIndex;
            this.keyCondition=keyFilter.keyCondition;
        }
    }

    public getWatchCount():number
    {
        return getObjKeyCount(this.pointers);
    }
}
