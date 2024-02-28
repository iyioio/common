import { ObjWatcher } from "./ObjWatcher";
import { RecursiveKeyOf } from "./common-types";
import { objWatchAryMove, objWatchAryRemove, objWatchAryRemoveAt, objWatchArySplice } from "./obj-watch-internal";
import { ObjRecursiveListenerOptionalEvt, ObjWatchEvt, ObjWatchEvtType, ObjWatchFilter, ObjWatchFilterValue, PathWatchOptions, RecursiveObjWatchEvt, Watchable, WatchedPath, anyProp, objWatchEvtSourceKey } from "./obj-watch-types";
import { deepClone } from "./object";

const watcherProp=Symbol('watcher');

/**
 * Gets or creates a object watcher for the given object and increments the watchers ref count
 */
export const watchObj=<T extends Watchable>(obj:T):ObjWatcher<T>=>{

    const watcher=getObjWatcher(obj,true);
    if(!watcher){
        throw new Error('Unable to create object watcher for obj');
    }
    watcher.refCount++;

    return watcher;
}

/**
 * Decrements the ref count of the given objects watcher. If the ref count is zero or less the
 * watcher is removed
 */
export const stopWatchingObj=<T>(obj:T):ObjWatcher<T>|undefined=>{

    const watcher=getObjWatcher(obj,false);
    if(!watcher){
        return undefined;
    }
    watcher.refCount--;

    if(watcher.eligibleForDispose()){
        watcher.dispose();
        delete (obj as any)[watcherProp];
    }

    return watcher;
}

/**
 * Get the watcher of the given object and optionally creates the watcher if it does not exist
 */
export const getObjWatcher=<T>(obj:T,autoCreate:boolean):ObjWatcher<T>|undefined=>{
    if(obj===null || obj===undefined || (typeof obj!=='object')){
        return undefined;
    }
    let watcher:ObjWatcher<T>|undefined=(obj as any)[watcherProp];
    if(watcher){
        return watcher;
    }
    if(!autoCreate){
        return undefined;
    }

    watcher=new ObjWatcher<T>(obj);
    (obj as any)[watcherProp]=watcher;

    return watcher;

}

/**
 * Watches an object and all of its descendants
 */
export const watchObjDeep=<T extends Watchable>(
    obj:T,
    listener:ObjRecursiveListenerOptionalEvt,
    options?:PathWatchOptions
):WatchedPath=>{
    return watchObj(obj).watchPath(null,listener,{deep:true,...options});
}

/**
 * Watches an object at the given path
 */
export const watchObjAtPath=<T extends Watchable>(
    obj:T,
    path:RecursiveKeyOf<T>,
    listener:ObjRecursiveListenerOptionalEvt,
    options?:PathWatchOptions
):WatchedPath=>{
    return watchObj(obj).watchPath(path as any,listener,options);
}

/**
 * Watches an object and all of its descendants based on a filter. The filter allows for specifying
 * multiple branching paths.
 */
export const watchObjWithFilter=<T extends Watchable>(
    obj:T,
    filter:ObjWatchFilter<T>,
    listener:ObjRecursiveListenerOptionalEvt,
    options?:PathWatchOptions
):WatchedPath=>{
    return watchObj(obj).watchDeepPath(filter,listener,options);
}

/**
 * Sets a value at the given path.
 */
export const wSetProp=<T,P extends keyof T>(obj:T|null|undefined,prop:P,value:T[P],source?:any):T[P]=>{
    if(!obj){
        return value;
    }
    const watcher=getObjWatcher<T>(obj,false);
    if(watcher){
        watcher.setProp(prop,value,source);
    }else{
        (obj as any)[prop]=value;
    }
    return value;
}

/**
 * Sets a value at the given path. If an object already exists at the path the existing and new value
 * are merged together. The existing value will be mutated.
 */
export const wSetOrMergeProp=<T,P extends keyof T>(obj:T|null|undefined,prop:P,value:T[P],source?:any):T[P]=>{
    if(!obj){
        return value;
    }
    const watcher=getObjWatcher<T>(obj,false);
    if(watcher){
        watcher.setOrMergeProp(prop,value,source);
    }else{
        (obj as any)[prop]=value;
    }
    return value;
}

/**
 * Sets a value at the given path using the current value and apply the not operator. This is
 * equivalent to `obj[prop]=!obj[prop]`
 */
export const wToggleProp=<T,P extends keyof T>(obj:T|null|undefined,prop:P,source?:any):boolean=>{
    if(!obj){
        return false;
    }
    const value=!obj[prop];
    wSetProp(obj,prop,value as any,source);
    return value;
}

/**
 * Sets or deletes the value at the given path. If the `value` is falsy then the value at the path is
 * deleted otherwise the value is set.
 */
export const wSetPropOrDeleteFalsy=<T,P extends keyof T>(obj:T|null|undefined,prop:P,value:T[P]):T[P]=>{
    if(!obj){
        return value;
    }
    const watcher=getObjWatcher<T>(obj,false);
    if(watcher){
        if(value){
            watcher.setProp(prop,value);
        }else{
            watcher.deleteProp(prop);
        }
    }else{
        if(value){
            (obj as any)[prop]=value;
        }else{
            delete (obj as any)[prop];
        }
    }
    return value;
}

/**
 * Sets or deletes the value at the given path. If the `value` equals `deleteWhen` then the value at the path is
 * deleted otherwise the value is set.
 */
export const wSetPropOrDeleteWhen=<T,P extends keyof T>(obj:T|null|undefined,prop:P,value:T[P],deleteWhen:T[P]):T[P]=>{
    if(!obj){
        return value;
    }
    const watcher=getObjWatcher<T>(obj,false);
    if(watcher){
        if(value!==deleteWhen){
            watcher.setProp(prop,value);
        }else{
            watcher.deleteProp(prop);
        }
    }else{
        if(value!==deleteWhen){
            (obj as any)[prop]=value;
        }else{
            delete (obj as any)[prop];
        }
    }
    return value;
}

/**
 * Deletes the value at the given path.
 */
export const wDeleteProp=<T,P extends keyof T>(obj:T|null|undefined,prop:P,source?:any):void=>{

     if(!obj){
        return;
    }
    const watcher=getObjWatcher<T>(obj,false);
    if(watcher){
        watcher.deleteProp(prop,source);
    }else{
        delete obj[prop];
    }
}


/**
 * Deletes all properties of an object
 */
export const wDeleteAllObjProps=(obj:any)=>{
    if(!obj){
        return;
    }
    for(const e in obj){
        wDeleteProp(obj,e);
    }
}

/**
 * Pushes a value onto an array
 */
export const wAryPush=<T extends Array<any>>(obj:T|null|undefined,...values:T[number][])=>{

     if(!obj){
        return;
    }
    const watcher=getObjWatcher<T>(obj,false);
    if(watcher){
        watcher.aryPush(...values);
    }else{
        obj.push(...values);
    }

}

/**
 * Splices an array
 */
export const wArySplice=<T extends Array<any>>(obj:T|null|undefined,index:number,deleteCount:number,...values:T[number][]):boolean=>{
    return wArySpliceWithSource<T>(undefined,obj,index,deleteCount,values);
}

/**
 * Splices an array and relays information about the source that triggered the change.
 */
export const wArySpliceWithSource=<T extends Array<any>>(source:any,obj:T|null|undefined,index:number,deleteCount:number,values:T[number][]):boolean=>{

     if(!obj){
        return false;
    }
    const watcher=getObjWatcher<T>(obj,false);
    if(watcher){
        return watcher.arySpliceWithSource(source,index as any,deleteCount,values);
    }else{
        return objWatchArySplice(obj,index,deleteCount,undefined,...values);
    }

}

/**
 * Removes the given value from an array
 */
export const wAryRemove=<T extends Array<any>>(obj:T|null|undefined,value:any):boolean=>{

     if(!obj){
        return false;
    }
    const watcher=getObjWatcher<T>(obj,false);
    if(watcher){
        return watcher.aryRemove(value);
    }else{
        return objWatchAryRemove(obj,value);
    }

}

/**
 * Removes a value from an array at the given index
 */
export const wAryRemoveAt=<T extends Array<any>>(obj:T|null|undefined,index:number,count=1):boolean=>{

     if(!obj){
        return false;
    }
    const watcher=getObjWatcher<T>(obj,false);
    if(watcher){
        return watcher.aryRemoveAt(index as any,count);
    }else{
        return objWatchAryRemoveAt(obj,index,count);
    }

}

/**
 * Moves items in an array
 */
export const wAryMove=<T extends Array<any>>(obj:T|null|undefined,fromIndex:number,toIndex:number,count=1,source?:any):boolean=>{

     if(!obj){
        return false;
    }
    const watcher=getObjWatcher<T>(obj,false);
    if(watcher){
        return watcher.aryMove(fromIndex as any,toIndex as any,count,source);
    }else{
        return objWatchAryMove(obj,fromIndex,toIndex,count);
    }

}

/**
 * Triggers an event on the given object. Event triggering allows objects to act as channels for events
 * without the actual object having any knowledge of the events.
 */
export const wTriggerEvent=<T>(obj:T|null|undefined,type:string|symbol,value?:any,source?:any):void=>{
    if(!obj){
        return;
    }


    const watcher=getObjWatcher<T>(obj,false);
    if(watcher){
        watcher.triggerChange({
            type:'event',
            eventType:type,
            eventValue:value,
            [objWatchEvtSourceKey]:source
        })
    }

}

/**
 * Triggers a change event for the given object.
 */
export const wTriggerChange=<T>(obj:T|null|undefined,source?:any):void=>{
    if(!obj){
        return;
    }


    const watcher=getObjWatcher<T>(obj,false);
    if(watcher){
        watcher.triggerChange({
            type:'change',
            [objWatchEvtSourceKey]:source,
        })
    }

}

/**
 * Triggers the `load` event for the given object.
 */
export const wTriggerLoad=<T>(obj:T|null|undefined,prop?:keyof T,source?:any):void=>{
    if(!obj){
        return;
    }


    const watcher=getObjWatcher<T>(obj,false);
    if(watcher){
        watcher.triggerChange({
            type:'load',
            prop,
            [objWatchEvtSourceKey]:source
        })
    }

}

export const isWatcherValueChangeEvent=(type:ObjWatchEvtType):boolean=>{

    switch(type){
        case 'set':
        case 'delete':
        case 'change':
        case 'aryChange':
        case 'aryMove':
            return true;

        default:
            return false;
    }
}

export const objWatchEvtToRecursiveObjWatchEvt=(evt:ObjWatchEvt<any>,path?:(string|number|null)[])=>{
    const source=evt[objWatchEvtSourceKey];
    evt=deepClone(evt);
    if(source!==undefined){
        evt[objWatchEvtSourceKey]=source;
    }
    if(path){
        path=[...path];
        path.shift();
        if(path.length!==0){
            path.reverse();
            (evt as RecursiveObjWatchEvt<any>).path=path;
        }
    }
    return evt;
}

export const isObjWatcherExplicitFilterMatch=(filter:ObjWatchFilter<any>,value:any,maxDepth=100):boolean=>{
    if(!value || !(typeof value === 'object') || maxDepth<0){
        return false;
    }

    for(const e in value){

        let f:ObjWatchFilterValue<any>=(filter as any)[e]??(filter as any)[anyProp];
        const subValue=value[e];
        if(subValue===undefined || !f){
            continue;
        }

        if(typeof f === 'function'){
            f=f(value,e);
        }

        if( f==='*' ||
            f===true ||
            (typeof f === 'object') && isObjWatcherExplicitFilterMatch(f,subValue,maxDepth-1)
        ){
            return true;
        }
    }

    return false;

}
