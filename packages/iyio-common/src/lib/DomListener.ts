import { DomKeyEvt } from "./dom-listener-types";
import { EvtHandleTrigger, createEvtTrigger } from "./evt";

export class DomListener
{

    private readonly keyPressEvtTrigger=createEvtTrigger<DomKeyEvt>(true);
    public get keyPressEvt(){return this.keyPressEvtTrigger.handle}

    private readonly keyDownEvtTrigger=createEvtTrigger<DomKeyEvt>(true);
    public get keyDownEvt(){return this.keyDownEvtTrigger.handle}


    public constructor()
    {
        if(globalThis.window){
            globalThis.window.addEventListener('keypress',this.onKeyPress)
            globalThis.window.addEventListener('keydown',this.onKeyDown)
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
        if(globalThis.window){
            globalThis.window.removeEventListener('keypress',this.onKeyPress)
            globalThis.window.removeEventListener('keydown',this.onKeyDown)
        }
    }

    private readonly onKeyPress=(nativeEvt:KeyboardEvent)=>{
        this.triggerEvent(nativeEvt,this.keyPressEvtTrigger);
    }

    private readonly onKeyDown=(nativeEvt:KeyboardEvent)=>{
        this.triggerEvent(nativeEvt,this.keyDownEvtTrigger);
    }

    private triggerEvent=(nativeEvt:KeyboardEvent,handler:EvtHandleTrigger<DomKeyEvt>)=>{
        if(!handler.listenerCount){
            return;
        }
        let k=nativeEvt.code.toLowerCase();
        if(k.startsWith('key')){
            k=k.substring(3);
        }
        const evt:DomKeyEvt={
            key:nativeEvt.key,
            keyMod:`${
                nativeEvt.ctrlKey || nativeEvt.metaKey?'ctrl+':''
            }${
                nativeEvt.altKey?'alt+':''}${nativeEvt.shiftKey?'shift+':''
            }${
                k
            }`,
            keyLowercase:nativeEvt.key.toLowerCase(),
            keyUppercase:nativeEvt.key.toUpperCase(),
            cancel:false,
            preventDefault(){
                nativeEvt.preventDefault();
            }
        }

        const active=globalThis.document?.activeElement;
        if(active && inputElems.includes(active.tagName.toLowerCase()) && (active instanceof HTMLElement)){
            evt.inputElem=active;
        }

        handler.trigger(evt);
    }

}

const inputElems=['input','textarea','select'];
