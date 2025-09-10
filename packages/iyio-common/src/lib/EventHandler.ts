import { DisposeCallback } from "./common-types.js";


export interface EvtHandle<TEvt,TListener extends ((evt:TEvt)=>void) = ((evt:TEvt)=>void)>
{

    /**
     * If true errors thrown by listeners will be caught and logged
     */
    readonly safe:boolean;

    /**
     * Adds an event listener
     */
    addListener(listener:TListener):void;

    /**
     * Adds an event listener and return a callback function that can be called to remove the listener
     */
    addListenerWithDispose(listener:TListener):DisposeCallback;

    /**
     * Attempts to remove the listener. If the listener is found and removed true is returned,
     * otherwise false is returned.
     */
    removeListener(listener:TListener):boolean;
}

export interface EvtHandleTrigger<TEvt,TListener extends ((evt:TEvt)=>void) = ((evt:TEvt)=>void)>
{

    /**
     * A reference to functions to add listeners to the event handle
     */
    readonly handle:EvtHandle<TEvt,TListener>;

    /**
     * If true errors thrown by listeners will be caught and logged
     */
    readonly safe:boolean;

    /**
     * Gets the number of listeners
     */
    get listenerCount():number;

    /**
     * Triggers the event without catching errors
     */
    trigger(evt:TEvt):void;

    /**
     * Asynchronously triggers the event without catching errors
     */
    triggerAsync(evt:TEvt):Promise<void>;

    /**
     * Removes all listeners
     */
    clearListeners():void;

    /**
     * Enables the event handle allowing listeners to be added and events to be triggered.
     * The event handle is enabled by default
     */
    enable():void;

    /**
     * Disables the event handle and optionally removes all listeners.
     */
    disable(clearListeners?:boolean):void;
}


export interface EvtHandleOptions<TEvt,TListener extends ((evt:TEvt)=>void) = ((evt:TEvt)=>void)>
{
    onAdd:(listener:TListener)=>void;
    onRemove:(listener:TListener)=>void;
}

export class EvtHandleInternal<TEvt,TListener extends ((evt:TEvt)=>void) = ((evt:TEvt)=>void)> implements EvtHandle<TEvt,TListener>, EvtHandleTrigger<TEvt>
{

    private listeners?:TListener[];

    private disabled?:boolean;

    public readonly handle:EvtHandle<TEvt,(evt:TEvt)=>void>;

    public readonly safe:boolean;

    private onAdd?:(listener:TListener)=>void;

    private onRemove?:(listener:TListener)=>void;

    public get listenerCount(){return this.listeners?.length??0}

    public constructor(safe:boolean,options?:EvtHandleOptions<TEvt,TListener>)
    {
        this.safe=safe;
        this.onAdd=options?.onAdd;
        this.onRemove=options?.onRemove;
        this.handle=this;
    }

    public addListener(listener:TListener):void{
        if(this.disabled){
            return;
        }
        if(!this.listeners){
            this.listeners=[];
        }
        this.listeners.push(listener);
        this.onAdd?.(listener);
    }

    public addListenerWithDispose(listener:TListener):DisposeCallback{
        if(this.disabled){
            return ()=>{/* */};
        }
        if(!this.listeners){
            this.listeners=[];
        }
        this.listeners.push(listener);
        this.onAdd?.(listener);
        return ()=>{
            this.removeListener(listener);
        }
    }

    public removeListener(listener:TListener):boolean{
        if(!this.listeners){
            return false;
        }
        const i=this.listeners.indexOf(listener);
        if(i===-1){
            return false;
        }
        this.listeners.splice(i,1);
        this.onRemove?.(listener);
        return true;
    }

    public trigger(evt:TEvt):void{
        if(!this.listeners || this.disabled){
            return;
        }
        for(const listener of this.listeners){
            if(this.safe){
                try{
                    listener(evt);
                }catch(ex){
                    console.error('EventHandler listener error',ex);
                }
            }else{
                listener(evt);
            }
            if((evt as any)?.cancel){
                break;
            }
        }
    }

    public async triggerAsync(evt:TEvt):Promise<void>{
        if(!this.listeners || this.disabled){
            return;
        }
        for(const listener of this.listeners){
            if(this.safe){
                try{
                    await (listener as any)(evt);
                }catch(ex){
                    console.error('EventHandler listener error',ex);
                }
            }else{
                await (listener as any)(evt);
            }
            if((evt as any)?.cancel){
                break;
            }
        }
    }

    public clearListeners(){
        delete this.listeners;
    }

    public enable()
    {
        delete this.disabled;
    }

    public disable(clearListeners=false){
        this.disabled=true;
        if(clearListeners){
            this.clearListeners();
        }
    }
}


export const createEvtTrigger=<TEvt,TListener extends ((evt:TEvt)=>void) = ((evt:TEvt)=>void)>(safe:boolean,options?:EvtHandleOptions<TEvt,TListener>):EvtHandleTrigger<TEvt>=>{
    return new EvtHandleInternal<TEvt,TListener>(safe,options);
}
