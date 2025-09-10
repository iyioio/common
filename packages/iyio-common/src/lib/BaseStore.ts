import { HashMap } from "./common-types.js";
import { getObjKeyCount } from "./object.js";
import { SharedValuePointer } from "./shared-pointers.js";
import { IStore, StoreKeyScope } from "./store-types.js";

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
