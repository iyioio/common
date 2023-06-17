import { ObjWatcher } from "./ObjWatcher";
import { objWatchAryMove, objWatchAryRemove, objWatchAryRemoveAt, objWatchArySplice } from "./obj-watch-internal";

const watcherProp=Symbol('watcher');

/**
 * Gets or creates a object watcher for the given object and increments the watchers ref count
 */
export const watchObj=<T>(obj:T):ObjWatcher<T>|undefined=>{

    const watcher=getObjWatcher(obj,true);
    if(!watcher){
        return undefined;
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

export const wSetProp=<T,P extends keyof T>(obj:T|null|undefined,prop:P,value:T[P]):T[P]=>{
    if(!obj){
        return value;
    }
    const watcher=getObjWatcher<T>(obj,false);
    if(watcher){
        watcher.setProp(prop,value);
    }else{
        (obj as any)[prop]=value;
    }
    return value;
}

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

export const wDeleteProp=<T,P extends keyof T>(obj:T|null|undefined,prop:P):void=>{

     if(!obj){
        return;
    }
    const watcher=getObjWatcher<T>(obj,false);
    if(watcher){
        watcher.deleteProp(prop);
    }else{
        delete obj[prop];
    }
}

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

export const wArySplice=<T extends Array<any>>(obj:T|null|undefined,index:number,deleteCount:number,...values:T[number][]):boolean=>{

     if(!obj){
        return false;
    }
    const watcher=getObjWatcher<T>(obj,false);
    if(watcher){
        return watcher.arySplice(index as any,deleteCount,...values);
    }else{
        return objWatchArySplice(obj,index,deleteCount,undefined,...values);
    }

}

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

export const wAryMove=<T extends Array<any>>(obj:T|null|undefined,fromIndex:number,toIndex:number,count=1):boolean=>{

     if(!obj){
        return false;
    }
    const watcher=getObjWatcher<T>(obj,false);
    if(watcher){
        return watcher.aryMove(fromIndex as any,toIndex as any,count);
    }else{
        return objWatchAryMove(obj,fromIndex,toIndex,count);
    }

}


export const wTriggerEvent=<T>(obj:T|null|undefined,type:string|symbol,value?:any):void=>{
    if(!obj){
        return;
    }


    const watcher=getObjWatcher<T>(obj,false);
    if(watcher){
        watcher.triggerChange({
            type:'event',
            eventType:type,
            eventValue:value
        })
    }

}


export const wTriggerChange=<T>(obj:T|null|undefined):void=>{
    if(!obj){
        return;
    }


    const watcher=getObjWatcher<T>(obj,false);
    if(watcher){
        watcher.triggerChange({
            type:'change',
        })
    }

}
