import { base64Encode } from "./base64.js";

export const base64UrlReg=/^data:[^;]{1,100};base64,/i;

export const createBase64DataUrl=(value:string,contentType:string):string=>{
    return `data:${contentType};base64,${base64Encode(value)}`;
}
