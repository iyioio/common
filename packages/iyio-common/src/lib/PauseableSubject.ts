import { BehaviorSubject } from "rxjs";
import { aryRemoveItem } from "./array.js";
import { DisposeCallback } from "./common-types.js";
import { log } from "./log.js";

/**
 * A BehaviorSubject that can have subscription updates paused.
 */
export class PauseableSubject<T> extends BehaviorSubject<T>
{

    private _pauseCount=0;

    private _pausedValue:any;

    public get pauseCount(){return this._pauseCount}


    override getValue():T{
        if(this._pauseCount){
            return this._pausedValue;
        }else{
            return super.getValue();
        }
    }

    public pause():void{
        if(!this._pauseCount){
            this._pausedValue=super.getValue();
        }
        this._pauseCount++;
    }

    public pauseWithDisposeCallback():DisposeCallback{
        this.pause();
        return ()=>{
            this.resume();
        }
    }

    public resume():boolean{
        if(this._pauseCount<=0){
            log('PauseableSubject resumed when not paused');
        }
        this._pauseCount--;
        if(!this._pauseCount){
            const v=this._pausedValue;
            this._pausedValue=undefined;
            if(v!==super.getValue()){
                super.next(v);
            }
            return true;
        }else{
            return false;
        }
    }

    public override next(value:T):void{
        if(this._pauseCount){
            this._pausedValue=value;
        }else{
            super.next(value);
        }
    }
}

/**
 * Provides a way to pause and resume multiple PauseableSubject at once as a group.
 */
export class PauseableSubjectGroup
{
     private _pauseCount=0;

    public get pauseCount(){return this._pauseCount}

    public pause():void{
        this._pauseCount++;
        for(const subject of this._subjects){
            subject.pause();
        }
    }

    public pauseWithDisposeCallback():DisposeCallback{
        this.pause();
        return ()=>{
            this.resume();
        }
    }

    public resume():boolean{
        if(this._pauseCount<=0){
            log('PauseableSubjectGroup resumed when not paused');
        }
        this._pauseCount--;

        if(this._subjects.length){
            const subjects=[...this._subjects];
            for(const subject of subjects){
                subject.resume();
            }
        }

        return !this._pauseCount;


    }

    private readonly _subjects:PauseableSubject<any>[]=[];

    public add(subject:PauseableSubject<any>):void{
        this._subjects.push(subject);
        for(let i=0,l=this._pauseCount;i<l;i++){
            subject.pause();
        }
    }

    public remove(subject:PauseableSubject<any>):boolean{
        if(!aryRemoveItem(this._subjects,subject)){
            return false;
        }
        for(let i=0,l=this._pauseCount;i<l;i++){
            subject.resume();
        }
        return true;
    }
}
