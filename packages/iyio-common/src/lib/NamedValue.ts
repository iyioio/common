import { ValueKeyProvider } from "./common-types";

export interface NamedValue<T>
{
    name:string;
    value:T;
}

export const getKeyForNamedValue=<T>(value:T|undefined,keyProvider:ValueKeyProvider<T>|undefined,defaultValue?:any)=>{
    if(!value || !keyProvider){
        return defaultValue;
    }
    if(typeof keyProvider === 'function'){
        return keyProvider(value);
    }else{
        return value[keyProvider];
    }
}
