import { JsonStore, JsonStoreOptions } from "./JsonStore.js";
import { defineBoolParam, defineStringParam } from "./scope-lib.js";
import { Scope } from "./scope-types.js";

export const localStorageKeyPrefixParam=defineStringParam('localStorageKeyPrefix');
export const localStorageIgnoreUndefineLocalStoageParam=defineBoolParam('localStorageIgnoreUndefineLocalStoage');

export interface LocalStorageStoreOptions extends JsonStoreOptions
{
    keyPrefix?:string;
    ignoreUndefinedLocalStorage?:boolean;
}

export class LocalStorageStore extends JsonStore
{

    public static optionsFromScope(scope:Scope):LocalStorageStoreOptions{
        return {
            keyPrefix:scope.to(localStorageKeyPrefixParam).get(),
            ignoreUndefinedLocalStorage:scope.to(localStorageIgnoreUndefineLocalStoageParam).get(),
        }
    }

    public static fromScope(scope:Scope):LocalStorageStore
    {
        return new LocalStorageStore(LocalStorageStore.optionsFromScope(scope));
    }

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
