import { defineFactory } from "./scope-lib";
import { WebSocketFactory } from "./ws";

export const webSocketFactory=defineFactory<WebSocketFactory>(
    'webSocketFactory',
    globalThis.WebSocket?(url,protocols)=>new globalThis.WebSocket(url,protocols):undefined
);
