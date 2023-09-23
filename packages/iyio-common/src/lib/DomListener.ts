import { DomKeyEvt } from "./dom-listener-types";
import { createEvtTrigger } from "./evt";

export class DomListener
{

    private readonly keyPressEvtTrigger=createEvtTrigger<DomKeyEvt>(true);
    public get keyPressEvt(){return this.keyPressEvtTrigger.handle}


    public constructor()
    {
        if(globalThis.window){
            globalThis.window.addEventListener('keypress',this.onKeyPress)
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
        }
    }

    private readonly onKeyPress=(nativeEvt:KeyboardEvent)=>{
        if(!this.keyPressEvtTrigger.listenerCount){
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
        this.keyPressEvtTrigger.trigger(evt);
    }

}
