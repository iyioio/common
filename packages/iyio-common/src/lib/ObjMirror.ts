import { objWatchEvtToRecursiveObjWatchEvt, wAryMove, wArySpliceWithSource, wDeleteProp, wSetOrMergeProp, wSetProp, wTriggerChange, wTriggerEvent, wTriggerLoad } from './obj-watch-lib';
import { ObjWatchEvt, RecursiveObjWatchEvt } from "./obj-watch-types";
import { getValueByAryPath } from './object';

export class ObjMirror{

    public readonly obj:any;

    public readonly mergeValues:boolean;

    public constructor(obj:any,mergeValues:boolean=false)
    {
        this.obj=obj;
        this.mergeValues=mergeValues;
    }


    public readonly recursiveCallback=(obj:any,evt:ObjWatchEvt<any>,path?:(string|number|null)[])=>{
        this.handleEvent(objWatchEvtToRecursiveObjWatchEvt(evt,path));
    }

    public handleEvents(evts:RecursiveObjWatchEvt<any>[],source?:any)
    {
        for(const evt of evts){
            this.handleEvent(evt,source);
        }
    }

    public handleEvent(evt:RecursiveObjWatchEvt<any>,source?:any)
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
                if(this.mergeValues){
                    wSetOrMergeProp(obj,evt.prop,evt.value,source);
                }else{
                    wSetProp(obj,evt.prop,evt.value,source);
                }
                break;

            case 'delete':
                wDeleteProp(obj,evt.prop,source);
                break;

            case 'aryChange':
                if(evt.values){
                    wArySpliceWithSource(source,obj,evt.index,evt.deleteCount??0,evt.values);
                }else{
                    wArySpliceWithSource(source,obj,evt.index,evt.deleteCount??0,[]);
                }
                break;

            case 'aryMove':
                wAryMove(obj,evt.fromIndex,evt.toIndex,evt.count,source);
                break;

            case 'change':
                wTriggerChange(obj,source);
                break;

            case 'load':
                wTriggerLoad(obj,evt.prop,source);
                break;

            case 'event':
                wTriggerEvent(obj,evt.eventType,evt.eventValue,source);
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
