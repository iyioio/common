import { Evt } from "./Evt";
import { EvtTrigger, EvtTriggerCallback } from "./EvtTrigger";
import { getValueByPath, setValueByPath } from "./object";
import { testValueCondition } from "./value-condition-lib";

export interface EvtTriggerPair
{
    evt:Evt;
    trigger:EvtTrigger;
}

export const isEvtTriggerMatch=(trigger:EvtTrigger,evt:Evt):boolean=>{
    const key=evt.key??evt.type;
    if(trigger.matchStart){
        if(!key.startsWith(trigger.matchKey)){
            return false;
        }
    }else if(trigger.matchKey!==key){
        return false;
    }

    if(trigger.condition && !testValueCondition(trigger.condition,{evt})){
        return false;
    }

    return true;
}

export const callEvtTriggerCallback=(trigger:EvtTrigger,evt:Evt,fallbackCallback?:EvtTriggerCallback):void=>{

    const cb=trigger.callback??fallbackCallback;
    if(!cb){
        return;
    }

    cb(evt,evt.key??evt.type,trigger);
}

export const tryCallEvtTriggerCallback=(trigger:EvtTrigger,evt:Evt,fallbackCallback?:EvtTriggerCallback):boolean=>{

    try{
        callEvtTriggerCallback(trigger,evt,fallbackCallback);
        return true;
    }catch(ex){
        console.error('Trigger callback failed',ex);
        return false;
    }
}

export interface EvtTriggerCtx
{
    evt:Evt;
    trigger:EvtTrigger;
    [key:string]:any;
}
export const getEvtTriggerValue=(trigger:EvtTrigger,ctx:EvtTriggerCtx):any=>{
    let value=trigger.value;
    if(!trigger.valueMap){
        return value;
    }
    if(!value || (typeof value!=='object')){
        value={}
    }

    for(const prop in trigger.valueMap){
        const sourcePath=trigger.valueMap[prop];
        if(!sourcePath){
            continue;
        }
        if(sourcePath.includes('{{')){
            setValueByPath(value,prop,sourcePath.replace(/\{\{(.*?)\}\}/g,(_,name:string)=>{
                return getValueByPath(ctx,name)
            }));
        }else{
            setValueByPath(value,prop,getValueByPath(ctx,sourcePath));
        }
    }

    return value;
}

export const transformTriggerToEvent=(trigger:EvtTrigger,ctx:EvtTriggerCtx):Evt|undefined=>{

    const type=trigger.type??trigger.topic;
    if(!type){
        return undefined;
    }

    return {
        type,
        value:getEvtTriggerValue(trigger,ctx),
        target:trigger.target,
        key:trigger.key
    }

}
