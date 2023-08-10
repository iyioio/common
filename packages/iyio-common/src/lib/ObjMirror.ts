import { Observable, Subject } from 'rxjs';
import { wAryMove, wArySplice, wDeleteProp, wSetProp, wTriggerChange, wTriggerEvent, wTriggerLoad } from './obj-watch-lib';
import { ObjWatchEvt, RecursiveObjWatchEvt } from "./obj-watch-types";
import { deepClone, getValueByAryPath } from './object';

export class ObjMirror{

    private readonly _onOutOfSync=new Subject<RecursiveObjWatchEvt<any>>();
    public get onOutOfSync():Observable<RecursiveObjWatchEvt<any>>{return this._onOutOfSync}


    public readonly obj:any;

    public constructor(obj:any)
    {
        this.obj=obj;
    }


    public readonly recursiveCallback=(obj:any,evt:ObjWatchEvt<any>,path?:(string|number|null)[])=>{
        evt=deepClone(evt);
        if(path){
            path=[...path];
            path.shift();
            if(path.length===0){
                path=undefined;
            }else{
                path.reverse();
                (evt as RecursiveObjWatchEvt<any>).path=path;
            }
        }
        this.handleEvent(evt);
    }

    public handleEvent(evt:RecursiveObjWatchEvt<any>)
    {
        let obj=this.obj;

        if(evt.path){
            obj=getValueByAryPath(obj,evt.path);
        }

        if(obj===undefined){
            return;
        }

        switch(evt.type){

            case 'set':
                wSetProp(obj,evt.prop,evt.value);
                break;

            case 'delete':
                wDeleteProp(obj,evt.prop);
                break;

            case 'aryChange':
                if(evt.values){
                    wArySplice(obj,evt.index,evt.deleteCount??0,...evt.values);
                }else{
                    wArySplice(obj,evt.index,evt.deleteCount??0);
                }
                break;

            case 'aryMove':
                wAryMove(obj,evt.fromIndex,evt.toIndex,evt.count);
                break;

            case 'change':
                wTriggerChange(obj);
                break;

            case 'load':
                wTriggerLoad(obj,evt.prop);
                break;

            case 'event':
                wTriggerEvent(obj,evt.eventType,evt.eventValue);
                break;
        }
    }



    private _isDisposed=false;
    public get isDisposed(){return this._isDisposed}
    public dispose()
    {
        if(this._isDisposed){
            return;
        }
        this._isDisposed=true;
    }
}
