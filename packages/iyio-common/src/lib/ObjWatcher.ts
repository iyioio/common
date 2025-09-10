import { DisposeCallback, RecursiveKeyOf } from "./common-types.js";
import { objWatchAryMove, objWatchAryRemoveAt, objWatchArySplice } from "./obj-watch-internal.js";
import { getObjWatcher, isObjWatcherExplicitFilterMatch, stopWatchingObj, wDeleteProp, wSetProp } from "./obj-watch-lib.js";
import { ObjRecursiveListener, ObjRecursiveListenerOptionalEvt, ObjWatchEvt, ObjWatchFilter, ObjWatchFilterValue, ObjWatchListener, PathListenerOptions, PathWatchOptions, WatchedPath, anyProp, objWatchEvtSourceKey } from "./obj-watch-types.js";
import { deepCompare, getValueByAryPath, getValueByReverseAryPath, isNonClassInstanceObject } from "./object.js";


let nextId=1;

interface ObjAncestor
{
    watcher:ObjWatcher<any>;
    key:string|number;
}

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
     * If true debugging info will be printed to the console
     */
    public debug?:boolean;

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
     * Adds a recursive listener that is only triggered when a change to the target path occurs.
     * Changes to the path of the returned WatchedPath object can be made without issue
     * @param pathOrFIlter Either a path to a property to listen to or a filter that can be listen
     *                     to specified properties
     * @param onChange If pathOrFIlter is a path ( string or array ) the value passed to onChange
     *                 will be the value pointed to by the path, otherwise the value will be the
     *                 value that caused the onChange to be called.
     */
    public addPathListener(
        pathOrFilter:(string|number)[]|ObjWatchFilter<T>|string|null,
        onChange:ObjRecursiveListener<any>,
        options?:PathListenerOptions
    ):WatchedPath{

        if(this.debug || options?.debug){
            console.info('addPathListener',pathOrFilter,options,this.obj);
        }

        if(pathOrFilter===null){
            pathOrFilter=[];
        }
        if(typeof pathOrFilter === 'string'){
            pathOrFilter=pathOrFilter.split('.');
        }

        const watchedPath:WatchedPath={
            path: pathOrFilter,
            listener:(obj,evt,evtPath)=>{
                if(this.debug || options?.debug){
                    console.info('path listener',JSON.stringify({
                        evtPath,
                        path: pathOrFilter,
                        thisObj:this.obj,
                        obj,
                    },null,4));
                }
                let value:any=undefined;
                if(Array.isArray(pathOrFilter)){
                    if(!evtPath.length || options?.deep?pathOrFilter.length>evtPath.length:evtPath.length>pathOrFilter.length){
                        return;
                    }
                    for(let i=0;i<evtPath.length && i<pathOrFilter.length;i++){
                        if(evtPath[evtPath.length-1-i]!==pathOrFilter[i]){
                            return;
                        }
                    }
                    value=getValueByAryPath(this.obj,pathOrFilter);
                }else{
                    let filter:any=pathOrFilter;
                    value=this.obj;
                    for(let i=evtPath.length-1;i>=0;i--){
                        const key=evtPath[i]?.toString();
                        if(key===undefined){
                            continue;
                        }

                        let pathF:ObjWatchFilterValue<any>=filter[key]??filter[anyProp];

                        if(typeof pathF==='function'){
                            pathF=pathF(value,key);
                        }

                        value=value?.[key];

                        if(pathF===true){
                            if(i===0){
                                break;
                            }else{
                                return;
                            }
                        }else if(pathF==='*'){
                            break;
                        }else if(typeof pathF==='object'){
                            if(i===0 && evt.type==='set' && !isObjWatcherExplicitFilterMatch(pathF,value)){
                                return;
                            }
                            filter=pathF;
                        }else{
                            return;
                        }

                    }
                    value=value=getValueByReverseAryPath(this.obj,evtPath);
                }

                onChange(value,evt,evtPath);
            },
            dispose:()=>{
                if(this.debug || options?.debug){
                    console.info('dispose addPathListener',pathOrFilter,options,this.obj);
                }
                this.removeRecursiveListener(watchedPath.listener);
            }
        }
        this.addRecursiveListener(watchedPath.listener);
        return watchedPath;
    }

    /**
     * Functions the same as addPathListener with the exception that onChange is immediately called
     */
    private _watchPath(path:(string|number)[]|ObjWatchFilter<T>|string|null,onChange:ObjRecursiveListenerOptionalEvt<any>,options?:PathWatchOptions):WatchedPath
    {

        const watchedPath=this.addPathListener(path,onChange,options);

        if(!options?.skipInitCall && Array.isArray(watchedPath.path) && path!==null){
            const value=getValueByAryPath(this.obj,watchedPath.path);
            onChange(value,null,null);
        }

        return watchedPath;
    }

    /**
     * Functions the same as addPathListener with the exception that onChange is immediately called
     */
    public watchPath(path:(string|number)[]|RecursiveKeyOf<T>|null,onChange:ObjRecursiveListenerOptionalEvt<any>,options?:PathWatchOptions):WatchedPath
    {
        return this._watchPath(path,onChange,options);
    }

    /**
     * Functions the same as watchPath except options.deep is set to true. This has
     * the effect of calling the onChange callback when descendant properties of the watched path
     * change.
     */
    public watchDeepPath(path:(string|number)[]|ObjWatchFilter<T>|string|null,onChange:ObjRecursiveListenerOptionalEvt<any>,options?:PathWatchOptions):WatchedPath
    {
        if(options){
            options={...options,deep:true}
        }else{
            options={deep:true}
        }
        return this._watchPath(path,onChange,options);
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

    public setOrMergeProp<K extends keyof T>(prop:K, value:T[K], source?:any):T[K]{
        const current=this.obj[prop];
        if( isNonClassInstanceObject(value) &&
            isNonClassInstanceObject(current)
        ){
            if(deepCompare(current,value)){
                return current;
            }
            _wMergeObj(1000,current,value,false,source);
            return current;
        }else{
            return this.setProp(prop,value,source);
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
        if(!(prop in (this.obj as object))){
            return;
        }
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


export const wMergeObj=(
    current:any,
    value:any,
    source?:any
):boolean=>{
    if(isNonClassInstanceObject(current) && isNonClassInstanceObject(value)){
        _wMergeObj(1000,current,value,false,source);
        return true;
    }else{
        return false;
    }
}

export const wMergeKeepObj=(
    current:any,
    value:any,
    source?:any
):boolean=>{
    if(isNonClassInstanceObject(current) && isNonClassInstanceObject(value)){
        _wMergeObj(1000,current,value,true,source);
        return true;
    }else{
        return false;
    }
}

const _wMergeObj=(
    maxDepth:number,
    current:any,
    value:any,
    keepValuesNotInValue:boolean,
    source?:any
):void=>{
    if(maxDepth<0){
        throw new Error('ObjectWatcher mergeObjs max depth reached');
    }
    const watcher=getObjWatcher(current,false);
    watcher?.requestQueueChanges();
    try{
        for(const e in value){

            const cv=current[e];
            const vv=value[e];
            if(isNonClassInstanceObject(cv) && isNonClassInstanceObject(vv)){
                _wMergeObj(maxDepth-1,cv,vv,keepValuesNotInValue,source);
            }else{
                wSetProp(current,e,vv,source);
            }
        }
        if(!keepValuesNotInValue){
            for(const e in current){
                if(value[e]===undefined){
                    wDeleteProp(current,e,source);
                }
            }
        }
    }finally{
        watcher?.requestDequeueChanges();
    }
}
