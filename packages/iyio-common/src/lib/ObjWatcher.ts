import { DisposeCallback } from "./common-types";
import { objWatchAryMove, objWatchAryRemoveAt, objWatchArySplice } from "./obj-watch-internal";
import { getObjWatcher, stopWatchingObj } from "./obj-watch-lib";
import { ObjRecursiveListener, ObjWatchEvt, ObjWatchListener } from "./obj-watch-types";


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
                if(typeof e === 'object'){
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

    public triggerChange(evt:ObjWatchEvt<T>){
        for(const listener of this.listeners){
            try{
                listener(this.obj,evt);
            }catch(ex){
                console.error(`ObjWatcher listener error. type:${evt.type}`,evt,ex)
            }
        }

        if(this.ancestors || this.rListeners){
            const path:(string|number)[]=[];
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
                case 'change':
                    break;
                default:
                    return;
            }
            const called:ObjWatcher<any>[]=[];
            this.triggerRecursiveChange(this.obj,path,evt,called);
        }
    }

    private triggerRecursiveChange(obj:any,path:(string|number)[],evt:ObjWatchEvt<any>,called:ObjWatcher<any>[]){

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

    public setProp<K extends keyof T>(prop:K, value:T[K]):T[K]{
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
        })
        return value;
    }

    public deleteProp<K extends keyof T>(prop:K):void{
        if(this._recursive){
            this.removeDescendant(prop);
        }
        delete this.obj[prop];
        this.triggerChange({
            type:'delete',
            prop,
        })
    }

    public aryPush(...values:TArrayValue[]):void{
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
            values:values as any
        })
    }

    public aryRemove(value:TArrayValue):boolean{
        if(!Array.isArray(this.obj)){
            return false;
        }
        const i=this.obj.indexOf(value);
        if(i===-1){
            return false;
        }
        return this.aryRemoveAt(i as TIndex,1);
    }

    public aryRemoveAt(index:TIndex,deleteCount=1):boolean{
        if( !Array.isArray(this.obj) ||
            (typeof index !== 'number') ||
            !objWatchAryRemoveAt(this.obj,index,deleteCount,this._recursive?()=>this.removeDescendant(index):undefined))
        {
            return false;
        }
        this.triggerChange({
            type:'aryChange',
            index:index,
            deleteCount
        })
        return true;
    }

    public aryInsert(index:TIndex,...values:TArrayValue[]):boolean{
        return this.arySplice(index,0,...values);
    }

    public arySplice(index:TIndex,deleteCount:number,...values:TArrayValue[]):boolean{
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
            values:values as any
        })
        return true;
    }

    public aryMove(fromIndex:TIndex,toIndex:TIndex,count=1):boolean{
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
        })
        return true;
    }


}
