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

        this.removeCallbacks=()=>{
            window.removeEventListener('keypress',this.onKeyPress);
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

        const key=(e.ctrlKey||e.metaKey?'c:':'')+(e.shiftKey?'s:':'')+e.key.toLowerCase();

        switch(key){

            case 'c:i':
                console.info('ProtogenCtrl',this.ctrl);
                console.info('ProtoNodes',this.ctrl.entities.value.map(n=>n.node.value));
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
