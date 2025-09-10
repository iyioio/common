import { defineFactory } from "./scope-lib.js";
import { WebSocketFactory } from "./ws.js";

export const webSocketFactory=defineFactory<WebSocketFactory>(
    'webSocketFactory',
    globalThis.WebSocket?(url,protocols)=>new globalThis.WebSocket(url,protocols):undefined
);
