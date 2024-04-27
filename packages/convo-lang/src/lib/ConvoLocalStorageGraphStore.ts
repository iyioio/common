import { ConvoMemoryGraphStore, ConvoMemoryGraphStoreOptions } from "./ConvoMemoryGraphStore";

const defaultStoreKey='convo-graph-store';

export interface ConvoLocalStorageGraphStoreOptions extends ConvoMemoryGraphStoreOptions
{
    storeKey?:string;
}

export class ConvoLocalStorageGraphStore extends ConvoMemoryGraphStore
{

    private readonly storeKey:string;


    public constructor({
        storeKey=defaultStoreKey,
        ...options
    }:ConvoLocalStorageGraphStoreOptions={}){
        super(options);
        this.storeKey=storeKey;

        const json=globalThis.localStorage?.getItem(storeKey);
        if(json){
            try{
                this.db=JSON.parse(json);
            }catch(ex){
                console.error('Invalid convo graph json',ex);
            }
        }

        this.onDbChange.subscribe(()=>this.save());
    }

    private save()
    {
        globalThis.localStorage.setItem(this.storeKey,JSON.stringify(this.db));
    }

}
