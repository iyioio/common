import { CancelToken, Scope, storeRoot } from "@iyio/common";
import { useEffect, useState } from "react";

export const useStoreItem=<T=any>(key:string|null|undefined,resetValueOnKeyChange=false,scope?:Scope):T|undefined=>{

    const [value,setValue]=useState<T|undefined>(undefined);

    useEffect(()=>{

        if(resetValueOnKeyChange){
            setValue(undefined);
        }

        if(!key){
            return;
        }

        const cancel=new CancelToken();

        (async ()=>{

            try{
                const v=await storeRoot(scope).getAsync(key,cancel);
                if(!cancel.isCanceled){
                    setValue(v);
                }
            }catch(ex){
                console.error(`Getting ${key} from store failed`,ex);
            }

        })();

        return ()=>{
            cancel.cancelNow();
        }

    },[key,resetValueOnKeyChange,scope]);

    return value;
}
