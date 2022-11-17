export const uriProtocolReg=/^(\w+):\/\//;
export const uriHostReg=/^\w+:\/\/([^/?&]+)/

export const getUriProtocol=(value:string):string|undefined=>uriProtocolReg.exec(value)?.[1];

export const getUriHost=(value:string):string|undefined=>uriHostReg.exec(value)?.[1];
