import { Query, queryClient } from "@iyio/common";
import { useEffect, useState } from "react";
import { useDeepCompareItem } from "./useCompareItem";

export const useQuery=<T>(query:Query|null|undefined):T[]|undefined=>{

    const q=useDeepCompareItem(query);

    const [value,setValue]=useState<T[]|undefined>(undefined);

    useEffect(()=>{

        if(!q){
            setValue(undefined);
            return;
        }

        let m=true;

        queryClient().selectQueryItemsAsync(q).then(v=>{
            if(!m){
                return;
            }
            setValue(v);
        })

        return ()=>{
            m=false;
        }

    },[q]);

    return value;
}
