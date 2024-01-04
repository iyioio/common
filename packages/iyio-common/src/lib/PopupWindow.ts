import { CancelToken } from "./CancelToken";
import { queryParamsToObject } from "./object";
import { uuid } from "./uuid";

export const popupWindowMessagePrefix='<PopupWindow>:';

export const sendPopupWindowMessage=(id:string,value:any)=>{
    globalThis.window.postMessage(`${popupWindowMessagePrefix}${id}::`+JSON.stringify(value??null));
}

export const getPopupWindowMessageAsync=(options:Omit<PopupWindowOptions,'callback'>,cancel=new CancelToken()):Promise<any>=>{
    return new Promise<any>((resolve,reject)=>{
        try{
            const win=new PopupWindow({disposeOnTrigger:true,...options,callback:value=>{
                resolve(value);
            }});
            cancel.onCancel(()=>{
                resolve(undefined);
                win.dispose();

            })
        }catch(ex){
            reject(ex);
        }
    });

}

export interface PopupWindowOptions
{
    /**
     * The url to open
     */
    url:string;

    /**
     * The target passed to window.open
     * @default "_blank"
     */
    target?:string;

    /**
     * The features passed to window.open
     */
    features?:string;

    /**
     * Called when either a matching messages is passed from the popup window or when locationTriggerReg
     * matches the location of the window.
     */
    callback?:(value:any)=>void;

    /**
     * If true the PopupWindow will be disposed on the trigger callback.
     * @default false
     */
    disposeOnTrigger?:boolean;

    /**
     * Name of a query parameter that when in the location of the popup window will trigger the
     * callback with the value of the query parameter.
     */
    queryParamTrigger?:string;

    /**
     * If true the callback is triggered as soon as the popup window navigates to the same host as
     * the current window
     */
    triggerOnSameHost?:boolean;

    /**
     * If the regex matches the current location of the popup windows location the callback will
     * be called.
     */
    locationTriggerReg?:RegExp;

    /**
     * The index of the group within the locationTriggerReg to use as the callback value.
     * @default 0
     */
    locationTriggerRegValueIndex?:number;

    /**
     * If the the opened window will not be closed when the PopupWindow is disposed.
     * @default false
     */
    keepOpen?:boolean;

    /**
     * The polling interval to be used with locationTriggerReg
     * @default 100
     */
    pollingIntervalMs?:number;

    /**
     * If defined, received messages must be a JSON object with an id prop that matches the given value.
     * @default uuid()
     */
    messageId?:string;

    /**
     * Changes the message id prop to the given value.
     * @default "id"
     */
    messageIdProp?:string;

    /**
     * If defined the callback will be triggered with an empty string after the timeout if no other
     * triggers occur.
     */
    timeoutMs?:number;
}

export class PopupWindow
{

    public readonly window:Window;

    private readonly options:PopupWindowOptions;

    public readonly messageId:string;

    private readonly iv:any;

    private readonly timeoutIv:any;

    public constructor(options:PopupWindowOptions)
    {
        this.messageId=popupWindowMessagePrefix+(options.messageId??uuid())+'::';
        this.options=options;
        const win=globalThis.window?.open?.(options.url,options.target??'_blank',options.features);
        if(!win){
            throw new Error('Unable to open Popup window')
        }

        this.window=win;

        this.window.addEventListener('message',this.messageListener);
        this.window.addEventListener('close',this.closeListener);

        if(options.locationTriggerReg || options.queryParamTrigger || options.triggerOnSameHost){
            let lastLocationTrigger:string|null=null;
            this.iv=setInterval(()=>{
                try{
                    if(this.isWindowClosed()){
                        this.trigger(undefined);
                        this.dispose();
                    }
                    const location=this.getWindowLocation();
                    if(!location || lastLocationTrigger===location){
                        return;
                    }
                    lastLocationTrigger=location;
                    if(options.locationTriggerReg){
                        const match=options.locationTriggerReg.exec(location);
                        if(match){
                            this.trigger(match[this.options.locationTriggerRegValueIndex??0]??'');
                            return;
                        }
                    }
                    const qi=location.indexOf('?');
                    if(options.queryParamTrigger && qi!==-1){
                        const query=queryParamsToObject(location.substring(qi));
                        const v=query[options.queryParamTrigger];
                        if(v!==undefined){
                            this.trigger(v);
                            return;
                        }
                    }
                    if( options.triggerOnSameHost &&
                        globalThis.location &&
                        this.window.location.host===globalThis.location?.host
                    ){
                        this.trigger('');
                        return;
                    }
                }catch{
                    //
                }
            },options.pollingIntervalMs??100);
        }

        if(options.timeoutMs){
            this.timeoutIv=setTimeout(()=>{
                this.trigger('');
            },options.timeoutMs)
        }
    }

    public getWindowLocation():string|undefined{
        try{
            return this.window.location.toString();
        }catch{
            return undefined;
        }
    }

    public isWindowClosed():boolean|undefined{
        try{
            return this.window.closed;
        }catch{
            return undefined;
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
        clearTimeout(this.timeoutIv);
        clearInterval(this.iv);
        if(this.window){
            try{
                this.window.removeEventListener('message',this.messageListener);
            }catch{
                //
            }
            try{
                this.window.removeEventListener('close',this.closeListener);
            }catch{
                //
            }
            if(!this.options.keepOpen){
                try{
                    this.window.close();
                }catch{
                    //
                }
            }
        }
    }

    private readonly messageListener=(evt:MessageEvent)=>{
        if((typeof evt.data !== 'string') || !evt.data.startsWith(this.messageId)){
            return;
        }
        const data=JSON.parse(evt.data.substring(this.messageId.length));
        this.trigger(data);
    }

    private readonly closeListener=()=>{
        this.trigger(undefined);
    }

    public trigger(value:any){
        if(this.isDisposed){
            return;
        }
        clearTimeout(this.timeoutIv);
        if(this.options.disposeOnTrigger){
            this.dispose();
        }
        this.options.callback?.(value);
    }
}
