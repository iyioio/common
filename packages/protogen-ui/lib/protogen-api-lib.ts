import { HashMap } from "@iyio/common";

const apiOutputBuffers:HashMap<string>={}

export const getApiOutput=(key:string):string|undefined=>{
    const value=apiOutputBuffers[key];
    delete apiOutputBuffers[key];
    return value;
}

export const setApiOutput=(key:string,value:string|null,append=false)=>{
    if(value===null){
        delete apiOutputBuffers[key];
    }else{
        apiOutputBuffers[key]=(append?apiOutputBuffers[key]??'':'')+value;
    }
}
