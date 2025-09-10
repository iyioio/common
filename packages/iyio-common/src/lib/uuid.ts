import { v4 } from 'uuid';
import { base64EncodeAry, fsBase64Chars } from './base64.js';

export function uuid():string{
    return v4();
}

const buf=new Uint8Array(16);
export function shortUuid():string{
    v4(undefined,buf,0);
    return base64EncodeAry([...buf],fsBase64Chars)
}
