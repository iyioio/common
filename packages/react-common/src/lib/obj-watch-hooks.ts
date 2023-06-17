import { ObjWatchEvt, stopWatchingObj, watchObj } from "@iyio/common";
import { useEffect, useRef, useState } from "react";

export const useWObj=<T>(obj:T,enabled=true):T=>{

    const [,setRefresh]=useState(0);

    useEffect(()=>{

        if(!obj || !enabled){
            return;
        }

        const watcher=watchObj(obj);
        if(!watcher){
            return;
        }

        let m=true;

        const listener=()=>{
            if(m){
                setRefresh(v=>v+1);
            }
        }

        watcher.addListener(listener);

        return ()=>{
            m=false;
            stopWatchingObj(obj);
            watcher.removeListener(listener);
        }

    },[obj,enabled]);

    return obj;
}


export const useWObjProp=<T,P extends T extends (null|undefined) ? any: keyof T>(obj:T,prop:P): T extends (null|undefined) ? undefined : T[P]=>{
    const value=useWProp<T,P>(obj,prop);

    useWObj(value);

    return value;
}

export const useWProp=<T,P extends T extends (null|undefined) ? any: keyof T>(obj:T,prop:P): T extends (null|undefined) ? undefined : T[P]=>{

    const [value,setValue]=useState<T[P]|undefined>((prop===null || prop===undefined || !obj)?undefined:obj[prop]);

    useEffect(()=>{

        if(!obj || !prop){
            setValue(undefined);
            return;
        }

        setValue(obj[prop]);

        const watcher=watchObj<T>(obj);
        if(!watcher){
            return;
        }

        let m=true;

        const listener=(_:T,evt:ObjWatchEvt<T>)=>{
            if(m && (evt.type==='set' || evt.type==='delete') && evt.prop===prop){
                setValue(obj[prop]);
            }
        }

        watcher.addListener(listener);

        return ()=>{
            m=false;
            stopWatchingObj(obj);
            watcher.removeListener(listener);
        }

    },[obj,prop]);

    return value as any;

}

export const useWEvent=<T>(obj:T|null|undefined,eventType:string|symbol|null|undefined,callback:(eventType:string|symbol,eventValue:any)=>void):void=>{

    const refs=useRef({callback,eventType});
    refs.current.callback=callback;
    refs.current.eventType=eventType;

    useEffect(()=>{

        if(!obj){
            return;
        }

        const watcher=watchObj<T>(obj);
        if(!watcher){
            return;
        }

        const listener=(_:T,evt:ObjWatchEvt<T>)=>{
            if(evt.type==='event' && (!refs.current.eventType || refs.current.eventType===evt.eventType)){
                refs.current.callback(evt.eventType,evt.eventValue);
            }
        }

        watcher.addListener(listener);


        return ()=>{
            watcher.removeListener(listener);
            stopWatchingObj(obj);
        }

    },[obj]);
}
