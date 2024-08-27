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

export const useVfsObject=<T=any>(path:string|null|undefined):T|null|undefined=>{

    const [item,setItem]=useState<T|null|undefined>(null);

    useEffect(()=>{
        setItem(null);
        if(!path){
            return;
        }
        let m=true;
        vfs().readObjectAsync(path).then(v=>{
            if(m){
                setItem(v);
            }
        })
        return ()=>{
            m=false;
        }
    },[path]);

    return item;

}
