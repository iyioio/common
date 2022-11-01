import { getObjKeyCount } from "@iyio/common";

let defaultValue:LocalStorageMock|null=null;
export const getDefaultLocalStorageMock=()=>{
    if(!defaultValue){
        defaultValue=new LocalStorageMock();
    }
    return defaultValue;
}

export const mockLocalStorage=()=>{
    if(!globalThis.localStorage){
        globalThis.localStorage=getDefaultLocalStorageMock();
    }
    if(typeof window !== 'undefined'){
        if(!window.localStorage){
            window.localStorage=getDefaultLocalStorageMock();
        }
    }
}

export class LocalStorageMock implements Storage {

    //private data:HashMap={};

    /** Returns the number of key/value pairs. */
    public get length(){
        return getObjKeyCount(this);
    };
    [name: string]: any;

    clear(): void {
        console.log('clear');
        //(this as any)={}
    }
    getItem(key: string): string | null {
        console.log('getItem',key);
        return (this as any)[key]??null;
    }
    key(index: number): string | null {
        console.log('key',index);
        let i=0;
        for(const e in (this as any)){
            if(i===index){
                return e;
            }
            i++;
        }
        return null;
    }
    removeItem(key: string): void {
        console.log('removeItem',key);
        delete (this as any)[key];
    }
    setItem(key: string, value: string): void {
        console.log('setItem',key,value);
        (this as any)[key]=value;
    }

}
