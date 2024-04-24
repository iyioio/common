import { aryRemoveItem } from "./array";
import { DisposeCallback } from "./common-types";
import { CanceledError } from "./errors";

export class CancelToken
{
    private _isCanceled:boolean=false;
    public get isCanceled():boolean{return this._isCanceled}

    private listeners:DisposeCallback[]|null=[];



    /**
     * The same as onCancel except an unsubscribe callback is returned that can be used to remove
     * the listener
     */
    public subscribe(listener:DisposeCallback):DisposeCallback{
        if(this._isCanceled || !this.listeners){
            return ()=>{/**/};
        }
        this.listeners.push(listener);
        return ()=>{
            if(this.listeners){
                aryRemoveItem(this.listeners,listener);
            }
        }
    }

    /**
     * The same as onCancelOrNextTick except an unsubscribe callback is returned that can be used
     * to remove the listener
     */
    public subscribeOrNextTick(listener:DisposeCallback):DisposeCallback{
        if(this._isCanceled || !this.listeners){
            setTimeout(listener,0);
            return ()=>{/**/};
        }
        this.listeners.push(listener);
        return ()=>{
            if(this.listeners){
                aryRemoveItem(this.listeners,listener);
            }
        }
    }

    /**
     * Adds the listener to the collection of listeners to be called when the token is canceled.
     * If the token is already canceled the listener will not be called and is not added to the
     * collection of listeners.
     */
    public onCancel(listener:DisposeCallback){
        if(this._isCanceled || !this.listeners){
            return;
        }
        this.listeners.push(listener);
    }

    /**
     * Adds the listener to the collection of listeners to be called when the token is canceled.
     * If the token is already canceled the listener will be called on the next pass of the event
     * loop and is not added to the collection of listeners.
     */
    public onCancelOrNextTick(listener:DisposeCallback){
        if(this._isCanceled || !this.listeners){
            setTimeout(listener,0);
            return;
        }
        this.listeners.push(listener);
    }

    public removeListener(listener:DisposeCallback){
        if(!this.listeners){
            return;
        }
        aryRemoveItem(this.listeners,listener);
    }


    public cancelNow=()=> // define as an arrow function so that cancel can be pass as a parameter without
    {
        if(this._isCanceled){
            return;
        }
        this._isCanceled=true;
        const listeners=this.listeners;
        this.listeners=null;
        if(listeners){
            for(const l of listeners){
                try{
                    l();
                }catch{
                    //
                }
            }
        }
    }

    /**
     * Cancels the token after the given number of milliseconds
     */
    public cancelAfter(ms:number){
        if(this._isCanceled){
            return;
        }
        setTimeout(this.cancelNow,ms);
    }

    public throwIfCanceled(cancelMessage?:string)
    {
        if(this._isCanceled){
            throw new CanceledError(cancelMessage);
        }
    }

    private asPromise?:Promise<void>;
    /**
     * Returns a promise that resolves when the token is canceled. If the token is already canceled
     * the promise is resolved immediately.
     */
    public toPromise():Promise<void>
    {
        if(this.asPromise){
            return this.asPromise;
        }
        return this.asPromise=new Promise<void>(resolve=>{
            if(this._isCanceled || !this.listeners){
                resolve();
                return;
            }
            this.listeners.push(resolve);
        })
    }
}
