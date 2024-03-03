import { aryRemoveItem, shortUuid } from '@iyio/common';
import { getChromeEnv } from './chrome-env';
import { ChromeMessage, ChromeMessageListener } from "./chrome-messaging-types";

interface ChannelPair
{
    toWorld:BroadcastChannel;
    toIso:BroadcastChannel;
}

const channelPairs:Record<string,ChannelPair>={};

const getChannelPair=(id='default')=>{
    return channelPairs[id]??(channelPairs[id]={
        toWorld:new BroadcastChannel(`chrome-messages-to-world-${id}`),
        toIso:new BroadcastChannel(`chrome-messages-to-iso-${id}`),
    })
}

export const sendChromeMessage=(msg:ChromeMessage,tabIds?:(number|null|undefined)[])=>{
    if(globalThis.chrome?.runtime?.sendMessage!==undefined && getChromeEnv()!=='main'){
        chrome.runtime.sendMessage(msg);
    }else{
        const pair=getChannelPair();
        pair.toIso.postMessage(msg);
    }
    if(tabIds && globalThis.chrome?.tabs?.sendMessage!==undefined){
        for(const id of tabIds){
            if(id===null || id===undefined){
                continue;
            }
            chrome.tabs.sendMessage(id,msg);
        }
    }
}
export const sendReceiveChromeMessageAsync=(msg:ChromeMessage,returnType?:string,tabIds?:(number|null|undefined)[]):Promise<ChromeMessage>=>{
    if(!msg.requestId){
        msg.requestId=shortUuid();
    }
    const p=new Promise<ChromeMessage>(r=>{
        addChromeMessageListener({
            resultId:msg.requestId,
            callback:r,
            autoRemove:true,
            type:returnType
        })
    });
    sendChromeMessage(msg,tabIds);
    return p;
}

const listeners:ChromeMessageListener[]=[];
export const addChromeMessageListener=(listener:ChromeMessageListener)=>{
    listeners.push(listener);
    if(!isListening){
        startListening();
    }
}

export const removeChromeMessageListener=(listener:ChromeMessageListener):boolean=>{
    return aryRemoveItem(listeners,listener);
}

const onMessage=(msg:ChromeMessage,sender?:chrome.runtime.MessageSender)=>{
    const lis=[...listeners];
    for(let i=0;i<lis.length;i++){
        const l=lis[i];
        if( !l ||
            (l.resultId && msg.resultId!==l.resultId) ||
            (l.type && msg.type!==l.type) ||
            (l.taskId && msg.taskId!==l.taskId) ||
            (l.to && msg.to!==l.to)
        ){
            continue
        }

        l.callback?.(msg);
        l.callbackEx?.(msg,sender);
        if(l.autoRemove){
            aryRemoveItem(listeners,l);
        }
    }
}

let isListening=false;
const startListening=()=>{
    if(isListening){
        return;
    }
    isListening=true;
    if(globalThis.chrome?.runtime?.onMessage?.addListener!==undefined  && getChromeEnv()!=='main'){
        chrome.runtime.onMessage.addListener((message,sender)=>{
            onMessage(message,sender);
        });
    }else{
        const pair=getChannelPair();
        pair.toWorld.addEventListener('message',(e)=>{
            onMessage(e.data);
        })
    }
}

export const createChromeIsoMainRelay=()=>{
    const pair=getChannelPair();
    console.log('hio 👋 👋 👋 start relay',pair);
    addChromeMessageListener({
        callbackEx:(msg)=>{
            console.log('hio 👋 👋 👋 relay to world',msg);
            pair.toWorld.postMessage(msg);
        }
    })
    pair.toIso.addEventListener('message',e=>{
        console.log('hio 👋 👋 👋 relay to iso',e);
        const msg:ChromeMessage=e.data;
        if(msg.type){
            sendChromeMessage(msg);
        }
    })
}
