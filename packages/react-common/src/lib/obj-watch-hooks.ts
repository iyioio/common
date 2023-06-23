import { ObjWatchEvt, isWatcherValueChangeEvent, stopWatchingObj, watchObj } from "@iyio/common";
import { useEffect, useRef, useState } from "react";

export interface UseWObjOptions
{
    disable?:boolean;
    /**
     * If true the load event will be triggered on the watched object
     */
    load?:boolean;

}

export const useWObjWithRefresh=<T>(obj:T,{
    disable,
    load,
}:UseWObjOptions={}):[T,number]=>{

    const [refresh,setRefresh]=useState(0);

    useEffect(()=>{

        if(!obj || disable){
            return;
        }

        const watcher=watchObj<T>(obj);
        if(!watcher){
            return;
        }

        let m=true;

        const listener=(obj:T,evt:ObjWatchEvt<T>)=>{
            if(m && isWatcherValueChangeEvent(evt.type)){
                setRefresh(v=>v+1);
            }
        }

        if(load){
            watcher.triggerChange({type:'load'})
        }

        watcher.addListener(listener);

        return ()=>{
            m=false;
            stopWatchingObj(obj);
            watcher.removeListener(listener);
        }

    },[obj,disable,load]);

    return [obj,refresh];
}
export const useWObj=<T>(obj:T,options={}):T=>{

    return useWObjWithRefresh<T>(obj,options)[0]
}


export const useWObjPropWithRefresh=<T,P extends T extends (null|undefined) ? any: keyof T>(
    obj:T,
    prop:P,
    objOptions?:UseWObjOptions,
    propOptions?:UseWPropOptions,
): [T extends (null|undefined) ? undefined : T[P],number]=>{

    const value=useWProp<T,P>(obj,prop,propOptions);

    return useWObjWithRefresh(value,objOptions);
}
export const useWObjProp=<T,P extends T extends (null|undefined) ? any: keyof T>(
    obj:T,
    prop:P,
    objOptions?:UseWObjOptions,
    propOptions?:UseWPropOptions,
): T extends (null|undefined) ? undefined : T[P]=>{

    const value=useWProp<T,P>(obj,prop,propOptions);

    return useWObj(value,objOptions);
}
export interface UseWPropOptions
{
    disable?:boolean;
    /**
     * If true the load event will be triggered on the watched object
     */
    load?:boolean;

}

export const useWProp=<T,P extends T extends (null|undefined) ? any: keyof T>(obj:T,prop:P,{
    disable,
    load,
}:UseWPropOptions={}): T extends (null|undefined) ? undefined : T[P]=>{

    const [value,setValue]=useState<T[P]|undefined>((prop===null || prop===undefined || !obj)?undefined:obj[prop]);

    useEffect(()=>{

        if(disable){
            return;
        }

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
            if(m && (((evt.type==='set' || evt.type==='delete') && evt.prop===prop))|| evt.type==='change'){
                setValue(obj[prop]);
            }
        }

        if(load){
            watcher.triggerChange({type:'load',prop:prop})
        }

        watcher.addListener(listener);

        return ()=>{
            m=false;
            stopWatchingObj(obj);
            watcher.removeListener(listener);
        }

    },[obj,prop,disable,load]);

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
