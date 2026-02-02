import { ObjRecursiveListenerOptionalEvt, ObjWatchEvt, ObjWatchFilter, ObjWatcher, PathValue, RecursiveKeyOf, Watchable, isWatcherValueChangeEvent, stopWatchingObj, watchObj, watchObjAtPath, watchObjDeep, watchObjWithFilter } from "@iyio/common";
import { useEffect, useRef, useState } from "react";

export interface UseWObjOptions<T>
{
    disable?:boolean;
    /**
     * If true the load event will be triggered on the watched object
     */
    load?:boolean;

    propFilter?:(keyof T)[];

}

export const useWatchPath=<
    T extends Watchable|null|undefined,
    P extends RecursiveKeyOf<Exclude<T,null|undefined>>|null|undefined,
    R=P extends string?PathValue<Exclude<T,null|undefined>,P>:never
>(obj:T,path:P):R|undefined=>{
    const [update,setUpdate]=useState<R|undefined>(undefined);
    useEffect(()=>{
        if(!obj || !path){
            return;
        }
        const watchedPath=watchObjAtPath<Required<T>>(obj as Required<T>,path as any,(obj)=>{
            setUpdate(obj);
        })

        return watchedPath.dispose;

    },[obj,path]);
    return update;
}

export const useWatchDeep=<T>(obj:T)=>{
    const [update,setUpdate]=useState(0);
    useEffect(()=>{
        if(!obj || (typeof obj !== 'object')){
            return;
        }
        const watchedPath=watchObjDeep(obj,()=>{
            setUpdate(v=>v+1);
        })

        return watchedPath.dispose;

    },[obj]);
    return update;
}

export interface UseWatchFilterOptions<T>
{
    filter:ObjWatchFilter<T>|null|undefined;
    filterChangeTrigger?:any;
    callback?:ObjRecursiveListenerOptionalEvt;
    rerenderOnChange?:boolean;
}

export const useWatchFilter=<T extends Watchable|undefined|null>(
    obj:T,
    options:UseWatchFilterOptions<Exclude<T,null|undefined>>,
)=>{
    const [update,setUpdate]=useState(0);
    const optionsRef=useRef(options);
    optionsRef.current=options;
    useEffect(()=>{
        const filter=optionsRef.current.filter;
        if(!obj || !filter){
            return;
        }
        const watchedPath=watchObjWithFilter<Exclude<T,null|undefined>>(obj as Exclude<T,null|undefined>,filter,(obj,evt,reversePath)=>{
            optionsRef.current.callback?.(obj,evt,reversePath);
            if(optionsRef.current.rerenderOnChange){
                setUpdate(v=>v+1);
            }
        },{skipInitCall:true})

        return watchedPath.dispose;

    },[obj,options.filterChangeTrigger]);
    return update;
}

export const useWObjWithRefresh=<T>(obj:T,{
    disable,
    load,
    propFilter
}:UseWObjOptions<T>={}):[T,number]=>{

    const [refresh,setRefresh]=useState(0);

    const refs=useRef({propFilter});
    refs.current.propFilter=propFilter;

    useEffect(()=>{

        if(!obj || disable || (typeof obj!=='object')){
            return;
        }

        const watcher=watchObj(obj) as ObjWatcher<T>;

        let m=true;

        const listener=(obj:T,evt:ObjWatchEvt<T>)=>{
            if( m &&
                isWatcherValueChangeEvent(evt.type) &&
                (
                    !refs.current.propFilter ||
                    (evt.type==='delete' || evt.type==='set'?
                        refs.current.propFilter.includes(evt.prop)
                    :true)
                )
            ){
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
export const useWObj=<T>(obj:T,options:UseWObjOptions<T>={}):T=>{

    return useWObjWithRefresh<T>(obj,options)[0]
}


export const useWObjPropWithRefresh=<T,P extends T extends (null|undefined) ? any: keyof T>(
    obj:T,
    prop:P,
    objOptions?:UseWObjOptions<T[P]>,
    propOptions?:UseWPropOptions,
): [T extends (null|undefined) ? undefined : T[P],number]=>{

    const value=useWProp<T,P>(obj,prop,propOptions);

    return useWObjWithRefresh(value,objOptions as any);
}
export const useWObjProp=<T extends object|null|undefined,P extends keyof NonNullable<T>>(
    obj:T,
    prop:P,
    objOptions?:UseWObjOptions<NonNullable<T>[P]>,
    propOptions?:UseWPropOptions,
): T extends (null|undefined) ? undefined : NonNullable<T>[P]=>{

    const value=useWProp<T,P>(obj,prop,propOptions);

    return useWObj(value,objOptions as any);
}
export interface UseWPropOptions
{
    disable?:boolean;
    /**
     * If true the load event will be triggered on the watched object
     */
    load?:boolean;

}

export const useWProp=<T,P extends keyof NonNullable<T>>(obj:T,prop:P,{
    disable,
    load,
}:UseWPropOptions={}): T extends (null|undefined) ? undefined : NonNullable<T>[P]=>{

    const [value,setValue]=useState<NonNullable<T>[P]|undefined>((prop===null || prop===undefined || !obj)?undefined:obj[prop]);

    useEffect(()=>{

        if(disable){
            return;
        }

        if(!obj || !prop){
            setValue(undefined);
            return;
        }

        setValue(obj[prop]);

        const watcher=watchObj(obj) as ObjWatcher<T>;

        let m=true;

        const listener=(_:T,evt:ObjWatchEvt<T>)=>{
            if(m && (((evt.type==='set' || evt.type==='delete') && evt.prop===prop))|| evt.type==='change'){
                setValue(obj[prop]);
            }
        }

        if(load){
            watcher.triggerChange({type:'load',prop:prop as any})
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

        const watcher=watchObj(obj) as ObjWatcher<T>;

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
