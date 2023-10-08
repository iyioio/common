import { DisposeCallback } from "@iyio/common";
import { Observable, Subject } from "rxjs";
import { ProtogenCtrl } from "./ProtogenCtrl";

export class ProtoKeyListener
{

    private readonly removeCallbacks:DisposeCallback;
    private readonly ctrl:ProtogenCtrl;

    private readonly _focusCmdRequested=new Subject<void>();
    public get focusCmdRequested():Observable<void>{return this._focusCmdRequested}

    public constructor(ctrl:ProtogenCtrl)
    {
        this.ctrl=ctrl;
        window.addEventListener('keypress',this.onKeyPress,true);
        window.addEventListener('keydown',this.onKeyDown,true);

        this.removeCallbacks=()=>{
            window.removeEventListener('keypress',this.onKeyPress,true);
            window.removeEventListener('keydown',this.onKeyDown,true);
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

            case 'c:s':
                this.ctrl.saveAsync();
                break;

            case 'c:o':
                this.ctrl.saveAsync({executePipeline:true});
                break;

            case 'escape':
                this.ctrl.showOutput=!this.ctrl.showOutput;
                break;

            case 'c:k':
                this.ctrl.clearOutput();
                break;

            case 'c:p':
                this._focusCmdRequested.next();
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
