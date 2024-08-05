export const uriProtocolReg=/^(\w+):\/\//;
export const uriHostReg=/^\w+:\/\/([^/?&]+)/

export const getUriProtocol=(value:string):string|undefined=>uriProtocolReg.exec(value)?.[1];

export const removeUriProtocol=(value:string):string=>{
    const p=getUriProtocol(value);
    if(!p){
        return value;
    }
    return value.substring(p.length+3);
}

export const getUriHost=(value:string):string|undefined=>uriHostReg.exec(value)?.[1];
