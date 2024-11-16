import { asArray } from "@iyio/common";
import { useDeepCompareItem } from "@iyio/react-common";
import { VfsDirReadOptions, VfsDirReadRecursiveOptions, VfsItem, VfsItemGetOptions, vfs } from "@iyio/vfs";
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

export const useVfsObject=<T=any>(pathOrItem:string|VfsItem|null|undefined,refresh?:number):T|null|undefined=>{

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
    },[path,refresh]);

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
        }).catch(()=>{
            //
        })
        return ()=>{
            m=false;
        }
    },[path]);

    return value;

}

export type UseVfsDirPath=string|VfsItem|(string|VfsItem|null|undefined)[]|null|undefined;
export const useVfsDirItems=(
    dir:UseVfsDirPath,
    options?:Omit<VfsDirReadOptions,'path'>
):VfsItem[]|null=>{

    const [items,setItems]=useState<VfsItem[]|null>(null);

    const _dir=useDeepCompareItem(dir);
    const _options=useDeepCompareItem(options);

    useEffect(()=>{
        if(!_dir){
            setItems(null);
            return;
        }
        const dirs=asArray(_dir)??[];
        let m=true;
        Promise.all(dirs.map(d=>!d?null:vfs().readDirAsync({
            ..._options,
            path:(typeof d==='string')?d:d.path
        }))).then(r=>{
            if(!m){
                return;
            }
            if(r.length===1){
                setItems(r[0]?.items??[]);
            }else{
                const items:VfsItem[]=[];
                for(const i of r){
                    if(!i){
                        continue;
                    }
                    items.push(...i.items);
                }
                setItems(items);
            }
        })
        return ()=>{
            m=false;
        }
    },[_dir,_options]);

    return items;
}

export const useVfsDirRecursiveItems=(
    dir:string|VfsItem|null|undefined,
    options?:Omit<VfsDirReadRecursiveOptions,'path'>,
    refresh?:number
):VfsItem[]|null=>{

    const [items,setItems]=useState<VfsItem[]|null>(null);

    const _dir=useDeepCompareItem(dir);
    const _options=useDeepCompareItem(options);

    useEffect(()=>{
        if(!_dir){
            setItems(null);
            return;
        }
        let m=true;
        vfs().readDirRecursiveAsync({
            path:(typeof _dir==='string')?_dir:_dir.path,
            ..._options
        }).then(v=>{
            if(m){
                setItems(v.items);
            }
        })
        return ()=>{
            m=false;
        }
    },[_dir,_options,refresh]);

    return items;
}
