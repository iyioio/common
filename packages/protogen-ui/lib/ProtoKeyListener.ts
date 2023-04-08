import { DisposeCallback } from "@iyio/common";
import { ProtogenCtrl } from "./ProtogenCtrl";

export class ProtoKeyListener
{

    private readonly removeCallbacks:DisposeCallback;
    private readonly ctrl:ProtogenCtrl;

    public constructor(ctrl:ProtogenCtrl)
    {
        this.ctrl=ctrl;
        window.addEventListener('keypress',this.onKeyPress);
        window.addEventListener('keydown',this.onKeyDown);

        this.removeCallbacks=()=>{
            window.removeEventListener('keypress',this.onKeyPress);
            window.removeEventListener('keydown',this.onKeyDown);
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
        this.removeCallbacks();
    }

    private readonly onKeyPress=(e:KeyboardEvent)=>{
        let handled=true;

        const key=getKey(e);

        switch(key){

            case 'c:i':
                console.info('ProtogenCtrl',this.ctrl);
                console.info('ProtoNodes',this.ctrl.nodes.value.map(n=>n.nodeSubject.value));
                break;

            default:
                handled=false;
                break;
        }

        if(handled){
            e.preventDefault();
            e.stopPropagation();
        }
    }

    private readonly onKeyDown=(e:KeyboardEvent)=>{
        let handled=true;

        const key=getKey(e);

        switch(key){

            case 'c:k':
            case 'escape':
                this.ctrl.clearApiOutput();
                break;

            default:
                handled=false;
                break;
        }

        if(handled){
            e.preventDefault();
            e.stopPropagation();
        }
    }
}

const getKey=(e:KeyboardEvent)=>(e.ctrlKey||e.metaKey?'c:':'')+(e.shiftKey?'s:':'')+e.key.toLowerCase();
