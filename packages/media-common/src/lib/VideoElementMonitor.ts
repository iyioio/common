import { ReadonlySubject } from "@iyio/common";
import { BehaviorSubject } from "rxjs";

export interface VideoElementMonitorOptions
{
    video:HTMLVideoElement;
    intervalMs?:number;
    stopTimeoutMs?:number;
    startTimeoutMs?:number;
    disableOnWindowBlur?:boolean;
}

export class VideoElementMonitor
{

    private readonly _frozen:BehaviorSubject<boolean|null>=new BehaviorSubject<boolean|null>(null);
    public get frozenSubject():ReadonlySubject<boolean|null>{return this._frozen}
    public get frozen(){return this._frozen.value}

    public readonly video:HTMLVideoElement;

    public readonly supported:boolean;

    public readonly intervalMs:number;

    public readonly stopTimeoutMs:number;

    public readonly disableOnWindowBlur:boolean;

    private hasFocus=true;

    private iv?:any;

    private lastFrameTime=0;

    public constructor({
        video,
        intervalMs=1000,
        stopTimeoutMs=intervalMs*3,
        startTimeoutMs,
        disableOnWindowBlur=false,
    }:VideoElementMonitorOptions){
        this.video=video;
        this.supported=(video as any).requestVideoFrameCallback?true:false;
        this.intervalMs=intervalMs;
        this.stopTimeoutMs=stopTimeoutMs;
        this.disableOnWindowBlur=disableOnWindowBlur;

        if(startTimeoutMs){
            setTimeout(()=>this.init(),startTimeoutMs)
        }else{
            this.init();
        }

    }

    private init(){
         if(this._isDisposed){
            return;
        }

        if(this.supported){
            this.iv=setInterval(this.checkForEmptyFrame,this.intervalMs);
            this.video.requestVideoFrameCallback(this.frameCallback);
        }else{
            this._frozen.next(false);
        }

        if(this.disableOnWindowBlur){
            globalThis.window?.addEventListener('blur',this._updateFocus);
            globalThis.document?.addEventListener('blur',this._updateFocus);
            globalThis.window?.addEventListener('focus',this._updateFocus);
            globalThis.document?.addEventListener('focus',this._updateFocus);
            globalThis.document?.addEventListener('visibilitychange',this._updateFocus);
            this.hasFocus=windowHasFocus();
        }else{
            this.hasFocus=true;
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
        clearInterval(this.iv);
        if(this.disableOnWindowBlur){
            globalThis.window?.removeEventListener('blur',this._updateFocus);
            globalThis.document?.removeEventListener('blur',this._updateFocus);
            globalThis.window?.removeEventListener('focus',this._updateFocus);
            globalThis.document?.removeEventListener('focus',this._updateFocus);
            globalThis.document?.removeEventListener('visibilitychange',this._updateFocus);
        }
    }

    public readonly checkForEmptyFrame=()=>{
        if(this._isDisposed || !this.supported || !this.hasFocus){
            return;
        }

        if(this._frozen.value===false && this.lastFrameTime<Date.now()-this.stopTimeoutMs){
            this.lastFrameTime=Date.now();
            this._frozen.next(true);
        }
    }

    private readonly frameCallback=()=>{
        if(this._isDisposed){
            return;
        }
        this.lastFrameTime=Date.now();
        if(this._frozen.value!==false){
            this._frozen.next(false);
        }
        setTimeout(()=>this.video.requestVideoFrameCallback(this.frameCallback),this.intervalMs);
    }

    private readonly _updateFocus=()=>{
        this.updateFocus();
        setTimeout(()=>this.updateFocus(),1);
    }

    private updateFocus()
    {
        if(this.isDisposed){
            return;
        }
        const hasFocus=windowHasFocus();
        if(this.hasFocus===hasFocus){
            return;
        }

        this.hasFocus=hasFocus;
        this.lastFrameTime=Date.now();
    }
}

const windowHasFocus=()=>globalThis.document?.hasFocus()??true;
