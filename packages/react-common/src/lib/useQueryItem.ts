import { Query, deepClone, queryClient } from "@iyio/common";
import { useEffect, useState } from "react";
import { useDeepCompareItem } from "./useCompareItem";

export const useQueryItem=<T>(query:Query|null|undefined,refresh?:number):T|undefined=>{

    const q=useDeepCompareItem(query);

    const [value,setValue]=useState<T|undefined>(undefined);

    useEffect(()=>{

        let _q=q;

        if(!_q){
            setValue(undefined);
            return;
        }

        let m=true;

        if(_q.limit===undefined){
            _q=deepClone(_q);
            _q.limit=1;
        }

        queryClient().selectQueryItemsAsync(_q).then(v=>{
            if(!m){
                return;
            }
            setValue(v[0]);
        })

        return ()=>{
            m=false;
        }

    },[q,refresh]);

    return value;
}
