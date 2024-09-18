import { Query, queryClient } from "@iyio/common";
import { useEffect, useState } from "react";
import { useDeepCompareItem } from "./useCompareItem";

const queryCache:Record<string,Promise<any[]>>={};

let lastLocation:string|undefined;

export interface UseQueryOptions
{
    refresh?:number;
    cache?:boolean|'location';
    disable?:boolean;
}

export const useQuery=<T>(query:Query|null|undefined,refreshOrOptions?:number|UseQueryOptions):T[]|undefined=>{

    let refresh:number|undefined;
    let cache:boolean|'location'=false;
    let disable=false;

    if(typeof refreshOrOptions==='number'){
        refresh=refreshOrOptions;
    }else if(refreshOrOptions){
        refresh=refreshOrOptions.refresh;
        cache=refreshOrOptions.cache??false;
        disable=refreshOrOptions.disable??false;
    }

    const q=useDeepCompareItem(query);

    const [value,setValue]=useState<T[]|undefined>(undefined);


    useEffect(()=>{

        if(!q || disable){
            setValue(undefined);
            return;
        }

        let m=true;
        let promise:Promise<any[]>|undefined;

        if(cache){
            const locKey=location.toString()+':::';
            if(cache==='location' && lastLocation!==locKey){
                lastLocation=locKey;
                for(const e in queryCache){
                    if(e.startsWith(locKey)){
                        delete queryCache[e];
                    }
                }
            }
            const key=(cache==='location'?locKey:'')+JSON.stringify(q);
            if(refresh){
                delete queryCache[key];
            }
            promise=queryCache[key]??(queryCache[key]=queryClient().selectQueryItemsAsync(q));
        }else{
            promise=queryClient().selectQueryItemsAsync(q);
        }

        promise?.then(v=>{
            if(!m){
                return;
            }
            setValue(v);
        })

        return ()=>{
            m=false;
        }

    },[q,refresh,cache,disable]);

    return value;
}
