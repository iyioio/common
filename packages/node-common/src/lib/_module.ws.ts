import { ScopeRegistration, webSocketFactory } from "@iyio/common";
import { WebSocket } from 'ws';

export const nodeWsModule=(reg:ScopeRegistration)=>{
    reg.addFactory(webSocketFactory,(url,protocols)=>new WebSocket(url,protocols) as any);
}
