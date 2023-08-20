
export const wsReadyStateConnecting=0;
export const wsReadyStateOpen=1;
export const wsReadyStateClosing=2;
export const wsReadyStateClosed=3;

export type WebSocketFactory=(url:string|URL,protocols?:string|string[])=>IWebSocket;


export interface WebSocketMessageEvent
{
    data:any;
}

export interface IWebSocket
{
    readonly protocol:string;
    readonly readyState:number;
    readonly url:string;
    readonly bufferedAmount:number;
    readonly extensions:string;

    close():void;
    send(data:string|Blob|ArrayBufferView):void;

    addEventListener(type:'open',callback:(evt:any)=>void):void;
    addEventListener(type:'close',callback:(evt:any)=>void):void;
    addEventListener(type:'error',callback:(evt:any)=>void):void;
    addEventListener(type:'message',callback:(evt:WebSocketMessageEvent)=>void):void;
    removeEventListener(type:'open',callback:(evt:any)=>void):void;
    removeEventListener(type:'close',callback:(evt:any)=>void):void;
    removeEventListener(type:'error',callback:(evt:any)=>void):void;
    removeEventListener(type:'message',callback:(evt:WebSocketMessageEvent)=>void):void;

}

