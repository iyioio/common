import { getObjKeyCount, HashMap, SharedValuePointer } from "@iyio/common";
import { IKeyValueStore, KeyValueStoreKeyScope } from "./key-value-store-types";

export abstract class BaseStore<T> implements IKeyValueStore<T>
{

    public keyBase?:string;

    public keyReg?:RegExp;

    public keyRegIndex?:number;

    public keyCondition?:(key:string)=>string|boolean;

    protected readonly pointers:HashMap<SharedValuePointer<T>>={};

    public constructor(keyFilter?:KeyValueStoreKeyScope)
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
