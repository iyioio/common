import { JsonStore, JsonStoreOptions } from "./JsonStore";

export interface LocalStorageStoreOptions extends JsonStoreOptions
{
    keyPrefix?:string;
    ignoreUndefinedLocalStorage?:string;
}

export class LocalStorageStore extends JsonStore
{

    private readonly keyPrefix:string;

    public constructor(options?:LocalStorageStoreOptions)
    {
        super(options);
        this.keyPrefix=options?.keyPrefix??'';
        if(!globalThis.localStorage){
            const msg='localStorage is not defined. LocalStorageStore should only be used in the browser';
            if(options?.ignoreUndefinedLocalStorage){
                console.warn(msg);
            }else{
                throw new Error(msg);
            }
        }
    }

    protected getValue(key: string): string | undefined {
        return globalThis.localStorage?.getItem(this.keyPrefix+key)??undefined;
    }
    protected putValue(key: string, value: string): void {
        globalThis.localStorage?.setItem(this.keyPrefix+key,value);
    }
    protected deleteValue(key: string): boolean {
        if(this.getValue(key)===undefined){
            return false;
        }
        globalThis.localStorage?.removeItem(this.keyPrefix+key);
        return true;
    }

}
