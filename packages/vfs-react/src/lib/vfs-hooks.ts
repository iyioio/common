import { useDeepCompareItem } from "@iyio/react-common";
import { VfsItem, VfsItemGetOptions, vfs } from "@iyio/vfs";
import { useEffect, useState } from "react";

export const useVfsItem=(path:string|null|undefined,options?:VfsItemGetOptions):VfsItem|null|undefined=>{

    const [item,setItem]=useState<VfsItem|null|undefined>(null);

    options=useDeepCompareItem(options);

    useEffect(()=>{
        setItem(null);
        if(!path){
            return;
        }
        let m=true;
        vfs().getItemAsync(path,options).then(v=>{
            if(m){
                setItem(v);
            }
        })
        return ()=>{
            m=false;
        }
    },[path,options]);

    return item;

}

export const useVfsObject=<T=any>(pathOrItem:string|VfsItem|null|undefined):T|null|undefined=>{

    const path=(typeof pathOrItem==='string')?pathOrItem:pathOrItem?.path;

    const [value,setValue]=useState<T|null|undefined>(null);

    useEffect(()=>{
        setValue(null);
        if(!path){
            return;
        }
        let m=true;
        vfs().readObjectAsync(path).then(v=>{
            if(m){
                setValue(v);
            }
        })
        return ()=>{
            m=false;
        }
    },[path]);

    return value;

}

export const useVfsString=(pathOrItem:string|VfsItem|null|undefined):string|null|undefined=>{

    const path=(typeof pathOrItem==='string')?pathOrItem:pathOrItem?.path;

    const [value,setValue]=useState<string|null|undefined>(null);

    useEffect(()=>{
        setValue(null);
        if(!path){
            return;
        }
        let m=true;
        vfs().readStringAsync(path).then(v=>{
            if(m){
                setValue(v);
            }
        })
        return ()=>{
            m=false;
        }
    },[path]);

    return value;

}
