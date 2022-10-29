import { IKeyValueStore, KeyValueStoreKeyScope } from "./key-value-store-types";

export abstract class BaseStore implements IKeyValueStore
{

    public keyBase?:string;

    public keyReg?:RegExp;

    public keyRegIndex?:number;

    public keyCondition?:(key:string)=>string|boolean;

    public constructor(keyFilter?:KeyValueStoreKeyScope)
    {
        if(keyFilter){
            this.keyBase=keyFilter.keyBase;
            this.keyReg=keyFilter.keyReg;
            this.keyRegIndex=keyFilter.keyRegIndex;
            this.keyCondition=keyFilter.keyCondition;
        }
    }
}
