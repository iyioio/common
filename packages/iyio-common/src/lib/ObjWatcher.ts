import { DisposeCallback, RecursiveKeyOf } from "./common-types";
import { objWatchAryMove, objWatchAryRemoveAt, objWatchArySplice } from "./obj-watch-internal";
import { getObjWatcher, stopWatchingObj } from "./obj-watch-lib";
import { ObjRecursiveListener, ObjWatchEvt, ObjWatchListener, WatchedPath, objWatchEvtSourceKey } from "./obj-watch-types";
import { getValueByAryPath } from "./object";


let nextId=1;

interface ObjAncestor
{
    watcher:ObjWatcher<any>;
    key:string|number;
}

export type Watchable=Record<string,any>|any[];

export class ObjWatcher<
    T,
    TIndex=T extends Array<any>?number:never,
    TArrayValue=T extends Array<any>?T[number]:never
>{
    public readonly obj:T;

    private readonly listeners:ObjWatchListener<T>[]=[];

    private rListeners?:ObjRecursiveListener[];

    private ancestors?:ObjAncestor[];

    /**
     * The number of references to the watcher. refCount is used to determine when the watcher can
     * be removed from the object it's watching
     */
    public refCount=0;

    /**
     * Unique id for the watcher withing the current process
     */
    public readonly id:number;

    private _recursive=false;

    /**
     * If true the watcher watches changes recursively.
     */
    public get recursive(){return this._recursive}

    public constructor(obj:T)
    {
        if(!(typeof obj === 'object')){
            throw new Error("Only objects and arrays can be watched by ObjWatcher");
        }
        this.id=nextId++;
        this.obj=obj;
    }

    private _isDisposed=false;
    public get isDisposed(){return this._isDisposed}
    public dispose()
    {
        if(this._isDisposed){
            return;
        }
        this._isDisposed=true;


        if(this._recursive){
            for(const e in this.obj){
                if(typeof this.obj[e] === 'object'){
                    const watcher=stopWatchingObj(this.obj[e]);
                    if(watcher){
                        watcher.removeAncestor(this as any,e);
                    }
                }
            }
        }
    }

    public eligibleForDispose(){
        return this.refCount<1 && (!this.ancestors || this.ancestors.length===0);
    }

    /**
     * Enables recursive watching. Once enable recursive watching can not be disabled.
     */
    public enableRecursive()
    {
        if(this._recursive){
            return;
        }
        this._recursive=true;
        this.scanRecursive();
    }

    public scanRecursive(){
        if(!this._recursive){
            return;
        }

        for(const e in this.obj){

            const v=this.obj[e];
            if(!(typeof v === 'object')){
                continue;
            }

            const watcher=getObjWatcher<any>(v,true);
            if(!watcher){
                continue;
            }
            watcher.enableRecursive();
            watcher.addAncestor(this as any,e);

        }
    }

    private addAncestor(ancestor:ObjWatcher<any>,key:string|number):boolean{
        if(!this.ancestors){
            this.ancestors=[];
        }
        for(let i=0;i<this.ancestors.length;i++){
            const a=this.ancestors[i];
            if(a && a.watcher===ancestor && a.key===key){
                return false;
            }
        }
        this.ancestors.push({watcher:ancestor,key});
        return true;
    }

    private removeAncestor(ancestor:ObjWatcher<any>,key:string|number):boolean{
        if(!this.ancestors){
            return false;
        }
        for(let i=0;i<this.ancestors.length;i++){
            const a=this.ancestors[i];
            if(a && a.watcher===ancestor && a.key===key){
                this.ancestors.splice(i,1);
                if(this.eligibleForDispose()){
                    this.dispose();
                }
                return true;
            }
        }
        return false;
    }

    /**
     * Adds a recursive listener that is only triggered when a change to the targed path occurs.
     * Changes to the path of the returned WatchedPath object can be made without issue
     */
    public addPathListener(path:(string|number)[]|RecursiveKeyOf<T>,onChange:(value:any)=>void):WatchedPath
    {

        if(typeof path === 'string'){
            path=path.split('.');
        }

        const watchedPath:WatchedPath={
            path,
            listener:(obj,evt,evtPath)=>{
                if(!evtPath.length || evtPath.length>path.length){
                    return;
                }
                for(let i=0;i<evtPath.length;i++){
                    if(evtPath[evtPath.length-1-i]!==path[i]){
                        return;
                    }
                }
                onChange(getValueByAryPath(this.obj,path as (string|number)[]));
            },
            dispose:()=>{
                this.removeRecursiveListener(watchedPath.listener);
            }
        }
        this.addRecursiveListener(watchedPath.listener);
        return watchedPath;
    }

    /**
     * Functions the same as addPathListener with the excpetion that onChange is immediately called
     */
    public watchPath(path:(string|number)[]|RecursiveKeyOf<T>,onChange:(value:any)=>void,skipInitCall=false):WatchedPath
    {
        const watchedPath=this.addPathListener(path,onChange);

        if(!skipInitCall){
            const value=getValueByAryPath(this.obj,watchedPath.path);
            onChange(value);
        }

        return watchedPath;
    }

    /**
     * Adds a recursive listener and enables recursive watching if not already enabled.
     */
    public addRecursiveListener(listener:ObjRecursiveListener):void{
        if(!this.rListeners){
            this.rListeners=[];
        }
        if(!this._recursive){
            this.enableRecursive();
        }
        this.rListeners.push(listener);
    }

    public addRecursiveListenerWithDispose(listener:ObjRecursiveListener):DisposeCallback{
        this.addRecursiveListener(listener);
        return ()=>{
            this.removeRecursiveListener(listener);
        }
    }

    public removeRecursiveListener(listener:ObjRecursiveListener):boolean{
        if(!this.rListeners){
            return false;
        }
        const i=this.rListeners.indexOf(listener);
        if(i===-1){
            return false;
        }
        this.rListeners.splice(i,1);
        return true;
    }

    public addListener(listener:ObjWatchListener<T>):void{
        this.listeners.push(listener);

    }

    public addListenerWithDispose(listener:ObjWatchListener<T>):DisposeCallback{
        this.listeners.push(listener);
        return ()=>{
            this.removeListener(listener);
        }
    }

    public removeListener(listener:ObjWatchListener<T>):boolean{
        const i=this.listeners.indexOf(listener);
        if(i===-1){
            return false;
        }
        this.listeners.splice(i,1);
        return true;
    }

    private changeQueue:ObjWatchEvt<T>[]=[];
    private queueChangeRequestCount=0;

    public requestQueueChanges()
    {
        this.queueChangeRequestCount++;
    }

    public requestDequeueChanges()
    {
        this.queueChangeRequestCount--;
        if(this.queueChangeRequestCount===0 && this.changeQueue.length){
            const queue=this.changeQueue;
            this.changeQueue=[];
            for(const evt of queue){
                this.triggerChange(evt);
            }
        }else if(this.queueChangeRequestCount<0){
            throw new Error('queue change request count unbalanced');
        }
    }

    public triggerChange(evt:ObjWatchEvt<T>){

        if(this.queueChangeRequestCount){
            this.changeQueue.push({...evt});
            return;
        }

        for(const listener of this.listeners){
            try{
                listener(this.obj,evt);
            }catch(ex){
                console.error(`ObjWatcher listener error. type:${evt.type}`,evt,ex)
            }
        }

        if(this.ancestors || this.rListeners){
            const path:(string|number|null)[]=[];
            switch(evt.type){
                case 'set':
                case 'delete':
                    path.push(evt.prop as any);
                    break;
                case 'aryChange':
                    path.push(evt.index);
                    break;
                case 'aryMove':
                    path.push(evt.toIndex);
                    break;
                case 'load':
                    if(evt.prop===undefined){
                        path.push(null);
                    }else{
                        path.push((evt.prop as any)??null);
                    }
                    break;
                default:
                    path.push(null);
                    break;
            }
            const called:ObjWatcher<any>[]=[];
            this.triggerRecursiveChange(this.obj,path,evt,called);
        }
    }

    private triggerRecursiveChange(obj:any,path:(string|number|null)[],evt:ObjWatchEvt<any>,called:ObjWatcher<any>[]){

        if(called.includes(this as any)){
            return;
        }

        called.push(this as any);

        if(this.rListeners){
            for(const listener of this.rListeners){
                try{
                    listener(obj,evt,path);
                }catch(ex){
                    console.error(`ObjWatcher recursive listener error. type:${evt.type}`,evt,ex)
                }
            }
        }

        if(this.ancestors){
            const i=path.length;
            for(const a of this.ancestors){
                path[i]=a.key;
                a.watcher.triggerRecursiveChange(this.obj,path,evt,called);
            }
            path.splice(i,1);
        }
    }

    private removeDescendant(key:any){
        const v=(this.obj as any)[key];
        if(typeof v === 'object'){
            const watcher=getObjWatcher(v,false);
            if(watcher){
                watcher.removeAncestor(this as any,key);
            }
        }
    }

    private addDescendant(key:any,value:any){
        if(!this._recursive){
            return;
        }
        if(typeof value === 'object'){
            const watcher=getObjWatcher(value,true);
            if(watcher){
                watcher.enableRecursive();
                watcher.addAncestor(this as any,key);
            }
        }
    }

    public setProp<K extends keyof T>(prop:K, value:T[K], source?:any):T[K]{
        if(this.obj[prop]===value){
            return value;
        }
        if(this._recursive){
            this.removeDescendant(prop);
        }
        this.obj[prop]=value;
        if(this._recursive){
            this.addDescendant(prop,value);
        }
        this.triggerChange({
            type:'set',
            prop,
            value,
            [objWatchEvtSourceKey]:source
        })
        return value;
    }

    public deleteProp<K extends keyof T>(prop:K, source?:any):void{
        if(this._recursive){
            this.removeDescendant(prop);
        }
        delete this.obj[prop];
        this.triggerChange({
            type:'delete',
            prop,
            [objWatchEvtSourceKey]:source
        })
    }
    public aryPush(...values:TArrayValue[]):void{
        this.aryPushWithSource(undefined,values);
    }

    public aryPushWithSource(source:any, values:TArrayValue[]):void{
        if(!Array.isArray(this.obj)){
            return;
        }
        const index=this.obj.length;
        this.obj.push(...values);
        if(this._recursive){
            for(let i=0;i<values.length;i++){
                this.addDescendant(index+i,values[i]);
            }
        }
        this.triggerChange({
            type:'aryChange',
            index,
            values:values as any,
            [objWatchEvtSourceKey]:source
        })
    }


    public aryRemove(value:TArrayValue,source?:any):boolean{
        if(!Array.isArray(this.obj)){
            return false;
        }
        const i=this.obj.indexOf(value);
        if(i===-1){
            return false;
        }
        return this.aryRemoveAt(i as TIndex,1,source);
    }

    public aryRemoveAt(index:TIndex,deleteCount=1,source?:any):boolean{
        if( !Array.isArray(this.obj) ||
            (typeof index !== 'number') ||
            !objWatchAryRemoveAt(this.obj,index,deleteCount,this._recursive?()=>this.removeDescendant(index):undefined))
        {
            return false;
        }
        this.triggerChange({
            type:'aryChange',
            index:index,
            deleteCount,
            [objWatchEvtSourceKey]:source
        })
        return true;
    }

    public aryInsert(index:TIndex,...values:TArrayValue[]):boolean{
        return this.arySpliceWithSource(undefined,index,0,values);
    }

    public aryInsertWithSource(source:any,index:TIndex,...values:TArrayValue[]):boolean{
        return this.arySpliceWithSource(source,index,0,values);
    }

    public arySplice(index:TIndex,deleteCount:number,...values:TArrayValue[]):boolean{
        return this.arySpliceWithSource(undefined,index,deleteCount,values);
    }

    public arySpliceWithSource(source:any,index:TIndex,deleteCount:number,values:TArrayValue[]):boolean{
        if( !Array.isArray(this.obj) ||
            (typeof index !== 'number') ||
            !objWatchArySplice(this.obj,index,deleteCount,this._recursive && deleteCount?()=>{
                for(let i=index+deleteCount-1;i>=index;i--){
                    this.removeDescendant(i);
                }
            }:undefined,...values))
        {
            return false;
        }
        if(this.recursive && values.length){
            for(let i=0;i<values.length;i++){
                this.addDescendant(index+i,values[i]);
            }
        }
        this.triggerChange({
            type:'aryChange',
            index:index,
            deleteCount,
            values:values as any,
            [objWatchEvtSourceKey]:source
        })
        return true;
    }

    public aryMove(fromIndex:TIndex,toIndex:TIndex,count=1,source?:any):boolean{
        if( !Array.isArray(this.obj) ||
            (typeof fromIndex !== 'number') ||
            (typeof toIndex !== 'number') ||
            !objWatchAryMove(this.obj,fromIndex,toIndex,count))
        {
            return false;
        }
        this.triggerChange({
            type:'aryMove',
            fromIndex,
            toIndex,
            count,
            [objWatchEvtSourceKey]:source
        })
        return true;
    }


}
